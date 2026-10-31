// Loaded with `--import` before any other module, so Sentry can instrument
// http, Hono and postgres. Without SENTRY_DSN the SDK stays disabled.
import { scrubBreadcrumb, scrubEvent } from '@homelibra/core/error-report';
import * as Sentry from '@sentry/node';

const production = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? (production ? 'production' : 'development'),
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: production ? 0.1 : 1.0,
  // No Library content and no session reaches Sentry (#40). SDK 11 collects
  // all of these by default: request bodies carry Notes and sign-in codes,
  // tRPC puts a query's input in the URL, headers and cookies carry the
  // session, and a stack frame's variables hold whatever it was working on.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    mcp: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
  },
  // What the SDK collects regardless: Drizzle's error messages carry the
  // query's values, and outgoing lookups (Crossref, Open Library) a Source's
  // ISBN or DOI in their URL.
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
});
