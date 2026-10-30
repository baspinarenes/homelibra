import { compareNotes, locatorSortValue } from '@homelibra/core/note';
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

const noteColumns = {
  id: note.id,
  locator: note.locator,
  locatorSort: note.locatorSort,
  excerpt: note.excerpt,
  comment: note.comment,
};

/** The sort value a Locator gets until the scholar corrects it. */
const derivedSort = (locator: string | null) => (locator === null ? null : locatorSortValue(locator));

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
        .values({ ...input, locatorSort: derivedSort(input.locator), accountId: ctx.accountId })
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

  /** A Source's Notes as the Source page lists them: in Locator order (core's compareNotes). */
  list: libraryProcedure.input(z.object({ sourceId: z.uuid() })).query(async ({ ctx, input }) => {
    await assertSource(ctx.tx, ctx.accountId, input.sourceId);
    const rows = await ctx.tx
      .select(noteColumns)
      .from(note)
      .where(and(eq(note.sourceId, input.sourceId), eq(note.accountId, ctx.accountId)));
    return rows.sort(compareNotes);
  }),

  get: libraryProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .select({ ...noteColumns, sourceId: note.sourceId })
      .from(note)
      .where(and(eq(note.id, input.id), eq(note.accountId, ctx.accountId)));
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return row;
  }),

  /**
   * Changes only what the call names; blank means empty. A sort value given
   * is kept as corrected; null derives it from the Locator again, and so
   * does a new Locator text that comes without one (#2 §5).
   */
  update: libraryProcedure
    .input(
      z.object({
        id: z.uuid(),
        locator: optionalText.optional(),
        // Whole numbers and a folio's half: what the field shows and reads back.
        locatorSort: z
          .array(
            z
              .number()
              .nonnegative()
              .refine((n) => Number.isInteger(n * 2), 'A whole number or a half'),
          )
          .min(1)
          .nullish(),
        excerpt: optionalText.optional(),
        comment: optionalText.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, locatorSort, ...changes } = input;
      const where = and(eq(note.id, id), eq(note.accountId, ctx.accountId));
      const [current] = await ctx.tx.select(noteColumns).from(note).where(where);
      if (!current) throw new TRPCError({ code: 'NOT_FOUND' });
      const locator = changes.locator === undefined ? current.locator : changes.locator;
      const excerpt = changes.excerpt === undefined ? current.excerpt : changes.excerpt;
      const comment = changes.comment === undefined ? current.comment : changes.comment;
      if (!excerpt && !comment)
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'An Excerpt or a Comment is needed' });
      const sort =
        locatorSort !== undefined
          ? (locatorSort ?? derivedSort(locator))
          : locator !== current.locator
            ? derivedSort(locator)
            : current.locatorSort;
      await ctx.tx
        .update(note)
        .set({ locator, excerpt, comment, locatorSort: sort, updatedAt: new Date() })
        .where(where);
      return { id };
    }),
});
