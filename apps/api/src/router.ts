import { notesRouter } from './routers/notes';
import { sourcesRouter } from './routers/sources';
import { router } from './trpc/init';

export const appRouter = router({
  sources: sourcesRouter,
  notes: notesRouter,
});

export type AppRouter = typeof appRouter;
