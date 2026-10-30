import { initTRPC, TRPCError } from '@trpc/server';

import { type Db, withLibrary } from '../db/client';
import type { Lookups } from '../lookups/lookups';
import type { Mailer } from '../mail/mailer';

export type Context = {
  db: Db;
  /** The signed-in Account, or null for an anonymous request. */
  accountId: string | null;
  /** Whether that Account has accepted the terms of use on its first sign-in. */
  termsAccepted: boolean;
  /** Whether that Account asked to be deleted and has not cancelled yet. */
  accountClosed: boolean;
  mailer: Mailer;
  /** ISBN and DOI lookups through the cache shared by every Library. */
  lookups: Lookups;
  /** What time it is for the API: Geri al's lifetime, when a Note entered its Source. Tests move it. */
  now: () => Date;
};

/** The app's first-sign-in screen stands between the scholar and the Library until this goes away. */
export const TERMS_NOT_ACCEPTED = 'TERMS_NOT_ACCEPTED';

/** A closed Account sees only the "silmeyi iptal et" screen until it cancels or is deleted. */
export const ACCOUNT_CLOSED = 'ACCOUNT_CLOSED';

const t = initTRPC.context<Context>().create();

export const router = t.router;

/**
 * A procedure about the signed-in Account itself, open before the terms of
 * use are accepted. It gets no Library transaction.
 */
export const accountProcedure = t.procedure.use(({ ctx, next }) => {
  const { accountId } = ctx;
  if (!accountId) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { accountId } });
});

/**
 * A procedure for a scholar whose Library is open (terms accepted, Account
 * not closed) that works outside it, such as a lookup: no Library
 * transaction, and no database handle at all.
 */
export const scholarProcedure = accountProcedure.use(({ ctx, next }) => {
  if (!ctx.termsAccepted) throw new TRPCError({ code: 'FORBIDDEN', message: TERMS_NOT_ACCEPTED });
  if (ctx.accountClosed) throw new TRPCError({ code: 'FORBIDDEN', message: ACCOUNT_CLOSED });
  return next();
});

/**
 * A procedure inside the signed-in Account's Library. The whole call runs in
 * one transaction with row-level security set to that Account; `ctx.tx` is
 * the only database handle it gets.
 */
export const libraryProcedure = scholarProcedure.use(({ ctx, next }) => {
  const { accountId } = ctx;
  return withLibrary(ctx.db, accountId, async (tx) => {
    const result = await next({ ctx: { tx, accountId, db: undefined } });
    // Roll the transaction back when the procedure failed.
    if (!result.ok) throw result.error;
    return result;
  });
});
