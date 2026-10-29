import { initTRPC, TRPCError } from '@trpc/server';

import { type Db, withLibrary } from '../db/client';

export type Context = {
  db: Db;
  /** The signed-in Account, or null for an anonymous request. */
  accountId: string | null;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;

/**
 * A procedure inside the signed-in Account's Library. The whole call runs in
 * one transaction with row-level security set to that Account; `ctx.tx` is
 * the only database handle it gets.
 */
export const libraryProcedure = t.procedure.use(({ ctx, next }) => {
  const { accountId } = ctx;
  if (!accountId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return withLibrary(ctx.db, accountId, async (tx) => {
    const result = await next({ ctx: { tx, accountId, db: undefined } });
    // Roll the transaction back when the procedure failed.
    if (!result.ok) throw result.error;
    return result;
  });
});
