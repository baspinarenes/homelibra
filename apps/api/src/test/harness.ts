import { randomUUID } from 'node:crypto';

import { afterAll } from 'vitest';

import { createApi } from '../app';
import { createDb } from '../db/client';
import type { Mailer } from '../mail/mailer';
import { appRouter } from '../router';
import { testDatabaseUrl, testMigrationDatabaseUrl } from './db';

/** Captures sign-in codes instead of sending them. */
export function fakeMailer() {
  const sent: { email: string; code: string }[] = [];
  const mailer: Mailer = {
    async sendSignInCode(email, code) {
      sent.push({ email, code });
    },
  };
  return {
    mailer,
    lastCodeFor(email: string) {
      const code = sent.findLast((m) => m.email === email)?.code;
      if (!code) throw new Error(`no code was sent to ${email}`);
      return code;
    },
  };
}

/** A fresh, unique address, so test files never share an Account. */
export function scholarEmail(name = 'akademisyen') {
  return `${name}-${randomUUID().slice(0, 8)}@example.org`;
}

/**
 * The API as a test sees it: the real router, Better Auth and our Postgres,
 * called in-process without HTTP. `owner` connects as the table owner and is
 * only for arranging fixtures that no procedure can create yet.
 */
export function testApi() {
  const db = createDb(testDatabaseUrl);
  const owner = createDb(testMigrationDatabaseUrl);
  const mail = fakeMailer();
  const api = createApi({
    db,
    mailer: mail.mailer,
    baseURL: 'http://localhost:3000',
    secret: 'test-secret-that-is-at-least-32-characters-long',
    trustedOrigins: [],
  });

  afterAll(async () => {
    await db.close();
    await owner.close();
  });

  async function requestCode(email: string) {
    await api.auth.api.sendVerificationOTP({ body: { email, type: 'sign-in' } });
  }

  /** Signs in on a new device with the code from the email; returns that device. */
  async function signIn(email: string) {
    await requestCode(email);
    const response = await api.auth.api.signInEmailOTP({
      body: { email, otp: mail.lastCodeFor(email) },
      asResponse: true,
    });
    if (!response.ok) throw new Error(`sign-in failed: ${response.status}`);
    const setCookie = response.headers.getSetCookie();
    const headers = new Headers({ cookie: setCookie.map((c) => c.split(';')[0]).join('; ') });
    const session = await api.auth.api.getSession({ headers });
    if (!session) throw new Error('signed in without a session');

    return {
      accountId: session.user.id,
      setCookie,
      /** A tRPC caller for one request from this device. */
      call: async () => appRouter.createCaller(await api.createContext(headers)),
      signOut: () => api.auth.api.signOut({ headers }),
    };
  }

  /** A caller with no session at all. */
  async function anonymous() {
    return appRouter.createCaller(await api.createContext(new Headers()));
  }

  return { api, db, owner, mail, requestCode, signIn, anonymous };
}
