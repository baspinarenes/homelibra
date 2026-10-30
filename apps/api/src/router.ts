import { accountRouter } from './routers/account';
import { sourcesRouter } from './routers/sources';
import { router } from './trpc/init';

export const appRouter = router({
  account: accountRouter,
  sources: sourcesRouter,
});

export type AppRouter = typeof appRouter;
