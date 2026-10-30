import * as Sentry from '@sentry/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { deleteClosedAccounts } from './account-deletion/account-deletion';
import { type AuthOptions, createAuth } from './auth';
import { deleteUnusedCovers, readCover } from './covers/covers';
import { libraryExport } from './export/library-export';
import type { Crossref } from './lookups/crossref';
import type { OpenLibrary } from './lookups/openlibrary';
import { lookups } from './lookups/lookups';
import { appRouter } from './router';
import type { ObjectStorage } from './storage/object-storage';
import { deleteExpiredUndoRecords } from './undo/undo';
import type { Context } from './trpc/init';

export type ApiOptions = AuthOptions & {
  /** Cross-origin web clients allowed in development; production is same-origin. */
  corsOrigins?: string[];
  crossref: Crossref;
  openLibrary: OpenLibrary;
  /** The private covers bucket (ADR-0011). */
  covers: ObjectStorage;
  /** What time it is for the lookup cache's seven days and Geri al; tests move it. The system clock by default. */
  now?: () => Date;
};

export function createApi(options: ApiOptions) {
  const auth = createAuth(options);
  const now = options.now ?? (() => new Date());
  const sharedLookups = lookups(
    options.db,
    { crossref: options.crossref, openLibrary: options.openLibrary },
    options.covers,
    now,
  );

  async function createContext(headers: Headers): Promise<Context> {
    const session = await auth.api.getSession({ headers });
    return {
      db: options.db,
      accountId: session?.user.id ?? null,
      termsAccepted: !!session?.user.termsAcceptedAt,
      accountClosed: !!session?.user.deletionRequestedAt,
      mailer: options.mailer,
      lookups: sharedLookups,
      covers: options.covers,
      now,
    };
  }

  const http = new Hono().basePath('/api');
  if (options.corsOrigins?.length) {
    http.use('*', cors({ origin: options.corsOrigins, credentials: true, exposeHeaders: ['content-disposition'] }));
  }
  http.get('/health', (c) => c.text('ok'));
  http.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw));
  // A Cover's file, for the Library whose Source has it. Its key changes with
  // the picture, so it is cached for good; not found looks the same whether
  // the key is another Library's, unused or its file is gone (ADR-0011).
  http.get('/covers/:key{.+}', async (c) => {
    const context = await createContext(c.req.raw.headers);
    if (!context.accountId) return c.body(null, 401);
    if (!context.termsAccepted || context.accountClosed) return c.body(null, 403);
    const bytes = await readCover(options.db, options.covers, context.accountId, c.req.param('key'));
    if (!bytes) return c.body(null, 404);
    return c.body(bytes, 200, {
      'content-type': 'image/jpeg',
      'cache-control': 'private, max-age=31536000, immutable',
    });
  });
  // Library export (#40, stories 16-18): the whole Library as one ZIP, any
  // time, at no cost (ADR-0004). A download rather than a tRPC call, so the
  // web app can save it as a file.
  http.get('/export', async (c) => {
    const context = await createContext(c.req.raw.headers);
    if (!context.accountId) return c.body(null, 401);
    if (!context.termsAccepted || context.accountClosed) return c.body(null, 403);
    const exportedAt = now();
    const zip = await libraryExport(options.db, options.covers, context.accountId, exportedAt);
    return c.body(zip, 200, {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="homelibra-${exportedAt.toISOString().slice(0, 10)}.zip"`,
      'cache-control': 'no-store',
    });
  });
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
    deleteUnusedCovers: (now: Date) => deleteUnusedCovers(options.db, options.covers, now),
  };

  return { auth, http, createContext, jobs };
}
