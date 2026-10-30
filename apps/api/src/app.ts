import * as Sentry from '@sentry/node';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { type AuthOptions, createAuth } from './auth';
import { appRouter } from './router';
import type { Context } from './trpc/init';

export type ApiOptions = AuthOptions & {
  /** Cross-origin web clients allowed in development; production is same-origin. */
  corsOrigins?: string[];
};

export function createApi(options: ApiOptions) {
  const auth = createAuth(options);

  async function createContext(headers: Headers): Promise<Context> {
    const session = await auth.api.getSession({ headers });
    return { db: options.db, accountId: session?.user.id ?? null };
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

  return { auth, http, createContext };
}
