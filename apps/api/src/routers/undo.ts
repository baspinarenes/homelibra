import { UNDO_CONFLICT, UNDO_EXPIRED } from '@homelibra/core/errors';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { libraryProcedure } from '../trpc/init';
import { applyUndo } from '../undo/undo';

/** Postgres's foreign-key and unique violations. */
const refusedByDatabase = (error: unknown) => {
  const code = (error as { cause?: { code?: string } }).cause?.code;
  return code === '23503' || code === '23505';
};

/**
 * Geri al (#40, "Silme ve Geri al"): every operation that offers it returns
 * a token, and `undo(token)` puts back what that operation took, with the
 * same ids. Sent again after it worked, it changes nothing.
 */
export const undoProcedure = libraryProcedure.input(z.object({ token: z.uuid() })).mutation(async ({ ctx, input }) => {
  let outcome: Awaited<ReturnType<typeof applyUndo>>;
  try {
    outcome = await applyUndo(ctx.tx, ctx.accountId, input.token, ctx.now());
  } catch (error) {
    if (refusedByDatabase(error)) throw new TRPCError({ code: 'CONFLICT', message: UNDO_CONFLICT, cause: error });
    throw error;
  }
  if (outcome === 'expired') throw new TRPCError({ code: 'NOT_FOUND', message: UNDO_EXPIRED });
});
