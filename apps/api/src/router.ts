import { sourcesRouter } from './routers/sources';
import { router } from './trpc/init';

export const appRouter = router({
  sources: sourcesRouter,
});

export type AppRouter = typeof appRouter;
