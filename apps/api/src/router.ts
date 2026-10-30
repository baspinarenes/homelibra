import { accountRouter } from './routers/account';
import { notesRouter } from './routers/notes';
import { searchRouter } from './routers/search';
import { sourcesRouter } from './routers/sources';
import { router } from './trpc/init';

export const appRouter = router({
  account: accountRouter,
  sources: sourcesRouter,
  notes: notesRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
