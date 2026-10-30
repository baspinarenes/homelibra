import { serve } from '@hono/node-server';

import { createApi } from './app';
import { createDb } from './db/client';
import { env } from './env';
import { consoleMailer, resendMailer } from './mail/mailer';

const api = createApi({
  db: createDb(env.DATABASE_URL),
  mailer: env.RESEND_API_KEY ? resendMailer({ apiKey: env.RESEND_API_KEY, from: env.MAIL_FROM }) : consoleMailer(),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [...env.TRUSTED_ORIGINS, ...env.CORS_ORIGINS],
  corsOrigins: env.CORS_ORIGINS,
  google:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      : undefined,
});

serve({ fetch: api.http.fetch, port: env.PORT }, (info) => {
  console.info(`api listening on :${info.port}`);
});
