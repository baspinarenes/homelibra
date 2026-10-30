import { accountRouter } from './routers/account';
import { lookupsRouter } from './routers/lookups';
import { notesRouter } from './routers/notes';
import { searchRouter } from './routers/search';
import { sourcesRouter } from './routers/sources';
import { router } from './trpc/init';

export const appRouter = router({
  account: accountRouter,
  sources: sourcesRouter,
  notes: notesRouter,
  search: searchRouter,
  lookups: lookupsRouter,
});

export type AppRouter = typeof appRouter;
