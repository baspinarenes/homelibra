import { serve } from '@hono/node-server';
import * as Sentry from '@sentry/node';

import { createApi } from './app';
import { createDb } from './db/client';
import { env } from './env';
import { crossrefClient } from './lookups/crossref';
import { consoleMailer, resendMailer } from './mail/mailer';

const api = createApi({
  db: createDb(env.DATABASE_URL),
  mailer: env.RESEND_API_KEY ? resendMailer({ apiKey: env.RESEND_API_KEY, from: env.MAIL_FROM }) : consoleMailer(),
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [...env.TRUSTED_ORIGINS, ...env.CORS_ORIGINS],
  corsOrigins: env.CORS_ORIGINS,
  crossref: crossrefClient(),
  google:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      : undefined,
});

serve({ fetch: api.http.fetch, port: env.PORT }, (info) => {
  console.info(`api listening on :${info.port}`);
});

const HOUR_MS = 60 * 60 * 1000;

/**
 * Scheduled jobs run here in the API container; there is no worker (#40).
 * Each runs once at start and then every `intervalMs`; a failed run is
 * reported and the next one tries again.
 */
function schedule(intervalMs: number, job: (now: Date) => Promise<unknown>) {
  const run = () => job(new Date()).catch((e) => Sentry.captureException(e));
  void run();
  setInterval(run, intervalMs);
}

// Hourly, so a closed Account goes within the hour its 14 days end.
schedule(HOUR_MS, api.jobs.deleteClosedAccounts);
