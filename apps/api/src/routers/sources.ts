import { compareTr } from '@homelibra/core';
import { type SourceField, sourceFields, type SourceFieldValues, sourceTypes } from '@homelibra/core/source';
import { TRPCError } from '@trpc/server';
import { and, count, eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';

import { source } from '../db/schema';
import { libraryProcedure, router } from '../trpc/init';

// Only Tür and Başlık are required; nothing else is validated, so a
// non-standard citation still goes in (#40, story 44). Blank means empty;
// left out (in an update) means unchanged.
const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value === undefined ? undefined : value?.trim() || null));

/** Type-specific fields by key: the filled ones and the ones the scholar cleared. */
const fieldsPatch = z.partialRecord(z.enum(sourceFields), z.string()).transform((values) => {
  const entries = Object.entries(values) as [SourceField, string][];
  return {
    filled: Object.fromEntries(entries.filter(([, value]) => value.trim())) as SourceFieldValues,
    cleared: entries.filter(([, value]) => !value.trim()).map(([key]) => key),
  };
});

const sourceInput = z.object({
  type: z.enum(sourceTypes),
  title: z.string().trim().min(1),
  author: optionalText,
  isbn: optionalText,
  doi: optionalText,
  bibliographicNote: optionalText,
  fields: fieldsPatch.optional(),
});

const sourceColumns = {
  id: source.id,
  type: source.type,
  title: source.title,
  author: source.author,
  isbn: source.isbn,
  doi: source.doi,
  bibliographicNote: source.bibliographicNote,
  fields: source.fields,
};

export const sourcesRouter = router({
  /** What Ana sayfa needs; while the Library is empty it shows "İlk kaynağını ekle". */
  home: libraryProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.tx.select({ sourceCount: count() }).from(source).where(eq(source.accountId, ctx.accountId));
    return { sourceCount: row?.sourceCount ?? 0 };
  }),

  /** The Kaynaklar list, by Başlık or by Yazar; Sources without a Yazar come last. */
  list: libraryProcedure.input(z.object({ sort: z.enum(['title', 'author']) })).query(async ({ ctx, input }) => {
    const rows = await ctx.tx
      .select({ id: source.id, type: source.type, title: source.title, author: source.author })
      .from(source)
      .where(eq(source.accountId, ctx.accountId));
    const byTitle = (a: (typeof rows)[number], b: (typeof rows)[number]) => compareTr(a.title, b.title);
    if (input.sort === 'title') return rows.sort(byTitle);
    return rows.sort((a, b) => {
      if (a.author === b.author) return byTitle(a, b);
      if (a.author === null) return 1;
      if (b.author === null) return -1;
      return compareTr(a.author, b.author) || byTitle(a, b);
    });
  }),

  create: libraryProcedure.input(sourceInput).mutation(async ({ ctx, input }) => {
    const id = uuidv7();
    const { fields: patch, ...columns } = input;
    await ctx.tx.insert(source).values({ ...columns, fields: patch?.filled, id, accountId: ctx.accountId });
    return { id };
  }),

  /**
   * Changes only what the call names. A type change never drops a field: the
   * fields the new type lacks stay stored and come back with the old type.
   */
  update: libraryProcedure.input(sourceInput.partial().extend({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { id, fields: patch, ...columns } = input;
    const [row] = await ctx.tx
      .update(source)
      .set({
        ...columns,
        ...(patch && {
          fields: sql`(${source.fields} || ${JSON.stringify(patch.filled)}::jsonb)
              - array(select jsonb_array_elements_text(${JSON.stringify(patch.cleared)}::jsonb))`,
        }),
        updatedAt: new Date(),
      })
      .where(and(eq(source.id, id), eq(source.accountId, ctx.accountId)))
      .returning({ id: source.id });
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return { id };
  }),

  get: libraryProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .select(sourceColumns)
      .from(source)
      .where(and(eq(source.id, input.id), eq(source.accountId, ctx.accountId)));
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return row;
  }),
});
