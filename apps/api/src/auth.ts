import { expo } from '@better-auth/expo';
import { EMAIL_TAKEN, NOT_INVITED } from '@homelibra/core/errors';
import * as Sentry from '@sentry/node';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
import { emailOTP } from 'better-auth/plugins';
import { lt, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

import type { Db } from './db/client';
import * as schema from './db/schema';
import { invitations } from './invitations/invitations';
import type { Mailer } from './mail/mailer';

const DAY_SECONDS = 60 * 60 * 24;

/** How long an emailed code works: sign-in, email change and Hesabı sil alike. */
export const CODE_LIFETIME_SECONDS = 10 * 60;
/** Wrong codes allowed before a code stops working, for every emailed code. */
export const CODE_ATTEMPTS = 3;

/**
 * The scheduled clean-up: every code past its time goes, whoever it was for
 * and whatever Better Auth calls it. Postgres says what time it is, not the
 * API's clock, which tests move. Returns how many went.
 */
export async function deleteExpiredCodes(db: Db) {
  const gone = await db
    .delete(schema.verification)
    .where(lt(schema.verification.expiresAt, sql`now()`))
    .returning({ id: schema.verification.id });
  return gone.length;
}

function notInvited() {
  return new APIError('FORBIDDEN', { code: NOT_INVITED, message: 'Homelibra is invitation-only for now.' });
}

export type AuthOptions = {
  db: Db;
  mailer: Mailer;
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
  /** Google sign-in's OAuth client; without it only email codes work. */
  google?: { clientId: string; clientSecret: string };
};

export function createAuth({ db, mailer, baseURL, secret, trustedOrigins, google }: AuthOptions) {
  const invited = invitations(db);

  return betterAuth({
    baseURL,
    basePath: '/api/auth',
    secret,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        account: schema.account,
        account_provider: schema.accountProvider,
        session: schema.session,
        verification: schema.verification,
      },
    }),
    // Google lands in the Account that already has its address: Better Auth
    // links the two when Google says it verified the address.
    socialProviders: google ? { google } : {},
    user: {
      modelName: 'account',
      // On the session, so the app knows without another request whether to
      // show the first-sign-in screen or the "silmeyi iptal et" screen. Only
      // the account router sets them.
      additionalFields: {
        termsAcceptedAt: { type: 'date', required: false, input: false },
        termsVersion: { type: 'string', required: false, input: false },
        deletionRequestedAt: { type: 'date', required: false, input: false },
      },
    },
    account: {
      modelName: 'account_provider',
      fields: { userId: 'homelibraAccountId', accountId: 'providerAccountId' },
    },
    session: {
      fields: { userId: 'accountId' },
      // A session stays open until the scholar signs out on that device.
      // 400 days is the longest cookie lifetime browsers honour; every use
      // after a day pushes the expiry forward again.
      expiresIn: 400 * DAY_SECONDS,
      updateAge: DAY_SECONDS,
    },
    advanced: {
      database: { generateId: () => uuidv7() },
    },
    databaseHooks: {
      // Only an Invitation opens an Account, whichever way the scholar
      // arrives. Google's callback turns this error into a redirect to the
      // app's error URL with ?error=NOT_INVITED.
      user: {
        create: {
          async before(user) {
            if (!(await invited.isInvited(user.email))) throw notInvited();
          },
        },
        update: {
          // An email change has gone through: the session still holds the
          // address the Account just left.
          async after(user, ctx) {
            const oldEmail = ctx?.context.session?.user.email;
            if (ctx?.path !== '/email-otp/change-email' || !oldEmail || oldEmail === user.email) return;
            await invited.move(oldEmail, user.email);
            // The change stands even if the notice cannot be sent.
            await mailer.sendEmailChangedNotice(oldEmail, user.email).catch((e) => Sentry.captureException(e));
          },
        },
      },
    },
    hooks: {
      // Closed beta: no code leaves for an address that has neither an
      // Invitation nor an Account. An open Account stays open even after the
      // Operator takes its address off the list.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/email-otp/send-verification-otp' && ctx.body?.type === 'sign-in') {
          if (!(await invited.mayRequestCode(String(ctx.body.email)))) throw notInvited();
        }
        // Better Auth would quietly send no code; the scholar is told instead.
        // Only a signed-in scholar learns this: this hook runs before the
        // endpoint's own session check, which turns everyone else away.
        if (ctx.path === '/email-otp/request-email-change' && (await getSessionFromCtx(ctx))) {
          if (await ctx.context.internalAdapter.findUserByEmail(String(ctx.body?.newEmail))) {
            throw new APIError('BAD_REQUEST', { code: EMAIL_TAKEN, message: 'Another Account uses this address.' });
          }
        }
      }),
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: CODE_LIFETIME_SECONDS,
        allowedAttempts: CODE_ATTEMPTS,
        async sendVerificationOTP({ email, otp, type }) {
          if (type === 'change-email') await mailer.sendEmailChangeCode(email, otp);
          else await mailer.sendSignInCode(email, otp);
        },
        // A code to the new address; the old one only hears about it afterwards.
        changeEmail: { enabled: true },
      }),
      expo(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
