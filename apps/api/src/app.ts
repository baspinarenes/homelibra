import * as Sentry from '@sentry/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { deleteClosedAccounts } from './account-deletion/account-deletion';
import { type AuthOptions, createAuth } from './auth';
import type { Crossref } from './lookups/crossref';
import { lookups } from './lookups/lookups';
import { appRouter } from './router';
import { deleteExpiredUndoRecords } from './undo/undo';
import type { Context } from './trpc/init';

export type ApiOptions = AuthOptions & {
  /** Cross-origin web clients allowed in development; production is same-origin. */
  corsOrigins?: string[];
  crossref: Crossref;
  /** What time it is for the lookup cache's seven days and Geri al; tests move it. The system clock by default. */
  now?: () => Date;
};

export function createApi(options: ApiOptions) {
  const auth = createAuth(options);
  const now = options.now ?? (() => new Date());
  const sharedLookups = lookups(options.db, { crossref: options.crossref }, now);

  async function createContext(headers: Headers): Promise<Context> {
    const session = await auth.api.getSession({ headers });
    return {
      db: options.db,
      accountId: session?.user.id ?? null,
      termsAccepted: !!session?.user.termsAcceptedAt,
      accountClosed: !!session?.user.deletionRequestedAt,
      mailer: options.mailer,
      lookups: sharedLookups,
      now,
    };
  }

  const http = new Hono().basePath('/api');
  if (options.corsOrigins?.length) {
    http.use('*', cors({ origin: options.corsOrigins, credentials: true }));
  }
  http.get('/health', (c) => c.text('ok'));
  http.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw));
  http.all('/trpc/*', (c) =>
    fetchRequestHandler({
      endpoint: '/api/trpc',
      req: c.req.raw,
      router: appRouter,
      createContext: () => createContext(c.req.raw.headers),
      // tRPC turns thrown errors into responses, so Hono never sees them.
      // Report only the unexpected ones, not UNAUTHORIZED and the like.
      onError: ({ error }) => {
        if (error.code === 'INTERNAL_SERVER_ERROR') Sentry.captureException(error.cause ?? error);
      },
    }),
  );

  /** The scheduled jobs (src/server.ts runs them), each told what time it is. */
  const jobs = {
    deleteClosedAccounts: (now: Date) => deleteClosedAccounts(options.db, now),
    deleteExpiredUndoRecords: (now: Date) => deleteExpiredUndoRecords(options.db, now),
  };

  return { auth, http, createContext, jobs };
}
