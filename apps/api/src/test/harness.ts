import { randomUUID } from 'node:crypto';

import { normalizeDoi } from '@homelibra/core/source';
import { afterAll, afterEach, vi } from 'vitest';

import { createApi } from '../app';
import { createDb } from '../db/client';
import { invitations } from '../invitations/invitations';
import type { Crossref } from '../lookups/crossref';
import type { Mailer } from '../mail/mailer';
import { appRouter } from '../router';
import type { ObjectStorage } from '../storage/object-storage';
import { testDatabaseUrl, testMigrationDatabaseUrl } from './db';

/** Captures codes and notices instead of sending them. */
export function fakeMailer() {
  const sent: { email: string; code: string }[] = [];
  const notices: { email: string; newEmail: string }[] = [];
  const mailer: Mailer = {
    async sendSignInCode(email, code) {
      sent.push({ email, code });
    },
    async sendEmailChangeCode(email, code) {
      sent.push({ email, code });
    },
    async sendEmailChangedNotice(email, newEmail) {
      notices.push({ email, newEmail });
    },
    async sendAccountDeletionCode(email, code) {
      sent.push({ email, code });
    },
  };
  return {
    mailer,
    /** The "your address changed" emails an address received. */
    noticesSentTo(email: string) {
      return notices.filter((m) => m.email === email).map(({ newEmail }) => ({ newEmail }));
    },
    codesSentTo(email: string) {
      return sent.filter((m) => m.email === email).map((m) => m.code);
    },
    lastCodeFor(email: string) {
      const code = sent.findLast((m) => m.email === email)?.code;
      if (!code) throw new Error(`no code was sent to ${email}`);
      return code;
    },
  };
}

/** A work as Crossref's REST API holds it; only DOI is certain to be there. */
type PublishedWork = { DOI: string; [field: string]: unknown };

/**
 * Stands in for Crossref behind its adapter: it holds the works a test
 * publishes and counts how often it was asked for each DOI.
 */
export function fakeCrossref() {
  const works = new Map<string, PublishedWork>();
  const asked: string[] = [];
  const crossref: Crossref = {
    async work(doi) {
      asked.push(doi);
      return works.get(doi) ?? null;
    },
  };
  return {
    crossref,
    /** Crossref registers a work; it is found under its DOI in any case. */
    publish(work: PublishedWork) {
      works.set(normalizeDoi(work.DOI) ?? work.DOI, work);
    },
    askedFor: (doi: string) => asked.filter((d) => d === doi).length,
  };
}

/**
 * Stands in for an S3 bucket behind its adapter: files in memory, each
 * stamped with the API's clock when it was written, so a test can let them
 * age. `lose` takes a file away behind the API's back, as a storage fault would.
 */
export function fakeObjectStorage(now: () => Date) {
  const files = new Map<string, { bytes: Uint8Array<ArrayBuffer>; contentType: string; storedAt: Date }>();
  const storage: ObjectStorage = {
    async put(key, bytes, contentType) {
      files.set(key, { bytes: new Uint8Array(bytes), contentType, storedAt: now() });
    },
    async get(key) {
      return files.get(key)?.bytes ?? null;
    },
    async *list() {
      for (const [key, { storedAt }] of files) yield { key, storedAt };
    },
    async delete(keys) {
      for (const key of keys) files.delete(key);
    },
  };
  return {
    storage,
    has: (key: string) => files.has(key),
    put: (key: string, bytes: Uint8Array) => storage.put(key, bytes, 'image/jpeg'),
    lose: (key: string) => files.delete(key),
  };
}

export type GoogleIdentity = { email: string; emailVerified?: boolean };

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/**
 * Stands in for Google at the edge: its token endpoint. Better Auth trades
 * the code from Google's redirect for tokens there and reads the scholar
 * from the id token, so the fake answers each code with an id token for the
 * identity it was handed out for. Every other request goes to the network.
 */
export function fakeGoogle() {
  const identities = new Map<string, GoogleIdentity & { sub: string }>();
  const realFetch = globalThis.fetch;
  const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url !== GOOGLE_TOKEN_ENDPOINT) return realFetch(input, init);
    const code = new URLSearchParams(String(init?.body)).get('code') ?? '';
    const who = identities.get(code);
    if (!who) return Response.json({ error: 'invalid_grant' }, { status: 400 });
    const claims = {
      iss: 'https://accounts.google.com',
      sub: who.sub,
      email: who.email,
      email_verified: who.emailVerified ?? true,
      name: '',
    };
    const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString('base64url');
    return Response.json({
      access_token: `access-${code}`,
      id_token: `${encode({ alg: 'RS256', kid: 'fake' })}.${encode(claims)}.signature`,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid email profile',
    });
  });

  return {
    /** The scholar consents on Google's page; Google hands back this code. */
    consent(identity: GoogleIdentity) {
      const code = randomUUID();
      identities.set(code, { ...identity, sub: `google-${identity.email}` });
      return code;
    },
    restore: () => spy.mockRestore(),
  };
}

/** A fresh, unique address, so test files never share an Account. */
export function scholarEmail(name = 'akademisyen') {
  return `${name}-${randomUUID().slice(0, 8)}@example.org`;
}

/** Where the web app runs; Google's redirects end up here. */
const WEB_APP = 'http://localhost:8081';

/** Turns the cookies a sign-in set into the request headers of that device. */
function cookieHeaders(setCookie: string[]) {
  return new Headers({ cookie: setCookie.map((c) => c.split(';')[0]).join('; ') });
}

/**
 * The API as a test sees it: the real router, Better Auth and our Postgres,
 * called in-process without a network. `owner` connects as the table owner
 * and is only for arranging fixtures that no procedure can create yet.
 */
export function testApi() {
  const db = createDb(testDatabaseUrl);
  const owner = createDb(testMigrationDatabaseUrl);
  const mail = fakeMailer();
  const google = fakeGoogle();
  const crossref = fakeCrossref();
  // Only the API's own clock moves: Better Auth shares the database with
  // other test files and would take their sign-in codes for expired ones.
  let passedMs = 0;
  afterEach(() => {
    passedMs = 0;
  });
  const now = () => new Date(Date.now() + passedMs);
  const covers = fakeObjectStorage(now);
  const api = createApi({
    db,
    mailer: mail.mailer,
    baseURL: 'http://localhost:3000',
    secret: 'test-secret-that-is-at-least-32-characters-long',
    trustedOrigins: [WEB_APP],
    google: { clientId: 'test-client-id', clientSecret: 'test-client-secret' },
    crossref: crossref.crossref,
    covers: covers.storage,
    now,
  });

  afterAll(async () => {
    google.restore();
    await db.close();
    await owner.close();
  });

  /** Asks for a sign-in code as the app does, over HTTP; the response says whether one was sent. */
  function requestCode(email: string) {
    return api.http.request('/api/auth/email-otp/send-verification-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, type: 'sign-in' }),
    });
  }

  /** The Operator invites an address to the closed beta. */
  async function invite(email: string) {
    await invitations(db).add(email);
  }

  async function uninvite(email: string) {
    await invitations(db).remove(email);
  }

  /**
   * Signs in on a new device with the code from the email; returns that
   * device. The Operator invites the address first unless `invite` is false,
   * and the scholar accepts the terms of use unless `acceptTerms` is false.
   */
  async function signIn(email: string, { invite: inviteFirst = true, acceptTerms = true } = {}) {
    if (inviteFirst) await invite(email);
    const sent = await requestCode(email);
    if (!sent.ok) throw new Error(`no code was sent: ${sent.status}`);
    const response = await api.auth.api.signInEmailOTP({
      body: { email, otp: mail.lastCodeFor(email) },
      asResponse: true,
    });
    if (!response.ok) throw new Error(`sign-in failed: ${response.status}`);
    const device = await deviceFrom(response.headers.getSetCookie());
    if (!device) throw new Error('signed in without a session');
    if (acceptTerms) await (await device.call()).account.acceptTerms({ version: 'test' });
    return device;
  }

  /**
   * Signs in with Google on a new device, as the web app does: ask the API
   * for Google's page, consent there as `identity`, and follow Google's
   * redirect back to the API. Returns where the API sends the browser next,
   * and the device when a session was opened, its terms of use accepted.
   */
  async function signInWithGoogle(identity: GoogleIdentity) {
    const start = await api.http.request('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: WEB_APP },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: `${WEB_APP}/`,
        errorCallbackURL: `${WEB_APP}/sign-in`,
      }),
    });
    if (!start.ok) throw new Error(`Google sign-in did not start: ${start.status}`);
    const { url } = (await start.json()) as { url: string };
    const state = new URL(url).searchParams.get('state') ?? '';

    const back = new URLSearchParams({ code: google.consent(identity), state });
    const callback = await api.http.request(`/api/auth/callback/google?${back}`, {
      headers: cookieHeaders(start.headers.getSetCookie()),
    });
    const location = callback.headers.get('location');
    if (!location) throw new Error(`Google callback did not redirect: ${callback.status}`);

    const device = await deviceFrom(callback.headers.getSetCookie());
    if (device) await (await device.call()).account.acceptTerms({ version: 'test' });
    return { redirectedTo: new URL(location), device };
  }

  /** The device holding these cookies, or null when they carry no session. */
  async function deviceFrom(setCookie: string[]) {
    const headers = cookieHeaders(setCookie);
    const session = await api.auth.api.getSession({ headers });
    if (!session) return null;

    return {
      accountId: session.user.id,
      setCookie,
      /** The signed-in Account as the session reports it now. */
      account: async () => {
        const now = await api.auth.api.getSession({ headers });
        if (!now) throw new Error('the session has ended');
        return now.user;
      },
      /** A plain HTTP GET from this device, such as an image the app shows. */
      get: (path: string) => api.http.request(path, { headers }),
      /** A tRPC caller for one request from this device. */
      call: async () => appRouter.createCaller(await api.createContext(headers)),
      /** Asks for a code at the new address, as Ayarlar does over HTTP. */
      requestEmailChange: (newEmail: string) => postAuth('/email-otp/request-email-change', headers, { newEmail }),
      /** Moves the Account to the new address with the code sent there. */
      changeEmail: (newEmail: string, otp: string) => postAuth('/email-otp/change-email', headers, { newEmail, otp }),
      signOut: () => api.auth.api.signOut({ headers }),
    };
  }

  function postAuth(path: string, headers: Headers, body: object) {
    const json = new Headers(headers);
    json.set('content-type', 'application/json');
    return api.http.request(`/api/auth${path}`, { method: 'POST', headers: json, body: JSON.stringify(body) });
  }

  /** Moves the API's clock on, until the test ends. */
  function passTime(ms: number) {
    passedMs += ms;
  }

  /** A caller with no session at all. */
  async function anonymous() {
    return appRouter.createCaller(await api.createContext(new Headers()));
  }

  return {
    api,
    db,
    owner,
    mail,
    crossref,
    covers,
    passTime,
    invite,
    uninvite,
    requestCode,
    signIn,
    signInWithGoogle,
    anonymous,
  };
}
