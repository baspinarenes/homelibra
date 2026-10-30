// Loaded with `--import` before any other module, so Sentry can instrument
// http, Hono and postgres. Without SENTRY_DSN the SDK stays disabled.
import * as Sentry from '@sentry/node';

const production = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? (production ? 'production' : 'development'),
  release: process.env.SENTRY_RELEASE,
  // Sign-in requests carry e-mail addresses and codes, so request bodies and
  // user data stay out of events (the SDK's conservative default).
  tracesSampleRate: production ? 0.1 : 1.0,
  includeLocalVariables: true,
});
