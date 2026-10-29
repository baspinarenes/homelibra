import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { uuidv7 } from 'uuidv7';

import type { Db } from './db/client';
import * as schema from './db/schema';
import type { Mailer } from './mail/mailer';

const DAY_SECONDS = 60 * 60 * 24;

export type AuthOptions = {
  db: Db;
  mailer: Mailer;
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
};

export function createAuth({ db, mailer, baseURL, secret, trustedOrigins }: AuthOptions) {
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
    user: { modelName: 'account' },
    account: {
      modelName: 'account_provider',
      fields: { userId: 'accountId', accountId: 'providerAccountId' },
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
