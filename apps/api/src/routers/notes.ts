import { TRPCError } from '@trpc/server';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';

import type { LibraryTx } from '../db/client';
import { note, source } from '../db/schema';
import { libraryProcedure, router } from '../trpc/init';

// Blank means empty. Inner line breaks stay: an Excerpt is copied verbatim.
const optionalText = z
  .string()
  .nullish()
  .transform((value) => value?.trim() || null);

/** Fails with NOT_FOUND unless the Source is in this Library. */
async function assertSource(tx: LibraryTx, accountId: string, sourceId: string) {
  const [row] = await tx
    .select({ id: source.id })
    .from(source)
    .where(and(eq(source.id, sourceId), eq(source.accountId, accountId)));
  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
}

export const notesRouter = router({
  /**
   * Captures a Note. The device makes its id, so a repeated call with the
   * same id (a retry, the outbox sending again) changes nothing (ADR-0008).
   * Only an Excerpt or a Comment is needed; Locator and Tags are not.
   */
  create: libraryProcedure
    .input(
      z
        .object({
          id: z.uuidv7(),
          sourceId: z.uuid(),
          locator: optionalText,
          excerpt: optionalText,
          comment: optionalText,
        })
        .refine((input) => input.excerpt || input.comment, { message: 'An Excerpt or a Comment is needed' }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertSource(ctx.tx, ctx.accountId, input.sourceId);
      await ctx.tx
        .insert(note)
        .values({ ...input, accountId: ctx.accountId })
        .onConflictDoNothing({ target: note.id });
      return { id: input.id };
    }),

  /** A Source's Notes as Capture shows them: oldest first, by their UUIDv7 ids. */
  flow: libraryProcedure.input(z.object({ sourceId: z.uuid() })).query(async ({ ctx, input }) => {
    await assertSource(ctx.tx, ctx.accountId, input.sourceId);
    return ctx.tx
      .select({ id: note.id, locator: note.locator, excerpt: note.excerpt, comment: note.comment })
      .from(note)
      .where(and(eq(note.sourceId, input.sourceId), eq(note.accountId, ctx.accountId)))
      .orderBy(asc(note.id));
  }),
});
