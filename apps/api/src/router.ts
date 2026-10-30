import { accountRouter } from './routers/account';
import { lookupsRouter } from './routers/lookups';
import { notesRouter } from './routers/notes';
import { searchRouter } from './routers/search';
import { sourcesRouter } from './routers/sources';
import { undoProcedure } from './routers/undo';
import { router } from './trpc/init';

export const appRouter = router({
  account: accountRouter,
  sources: sourcesRouter,
  notes: notesRouter,
  search: searchRouter,
  lookups: lookupsRouter,
  undo: undoProcedure,
});

export type AppRouter = typeof appRouter;
