import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { emailOTP } from 'better-auth/plugins';
import { uuidv7 } from 'uuidv7';

import type { Db } from './db/client';
import * as schema from './db/schema';
import { invitations } from './invitations/invitations';
import type { Mailer } from './mail/mailer';

const DAY_SECONDS = 60 * 60 * 24;

/** The app's sign-in screen shows "Homelibra şu an davetle açık" for this code. */
const NOT_INVITED = 'NOT_INVITED';

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
    user: { modelName: 'account' },
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
      },
    },
    hooks: {
      // Closed beta: no code leaves for an address that has neither an
      // Invitation nor an Account. An open Account stays open even after the
      // Operator takes its address off the list.
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/email-otp/send-verification-otp' || ctx.body?.type !== 'sign-in') return;
        if (!(await invited.mayRequestCode(String(ctx.body.email)))) throw notInvited();
      }),
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 10 * 60,
        async sendVerificationOTP({ email, otp }) {
          await mailer.sendSignInCode(email, otp);
        },
      }),
      expo(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
