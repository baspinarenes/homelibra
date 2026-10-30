import { compareTr } from '@homelibra/core';
import { type CalendarDate, calendars, sortValue } from '@homelibra/core/date';
import {
  isFilled,
  isSourceDateField,
  type SourceField,
  sourceFields,
  type SourceFieldValues,
  sourceTypes,
} from '@homelibra/core/source';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';

import { note, source } from '../db/schema';
import { libraryProcedure, router } from '../trpc/init';

// Only Tür and Başlık are required; nothing else is validated, so a
// non-standard citation still goes in (#40, story 44). Blank means empty;
// left out (in an update) means unchanged.
const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value === undefined ? undefined : value?.trim() || null));

/** A Date that exists in its calendar; 20 Şubat 1332 r. or 30 Safer does not. */
const calendarDate = z
  .strictObject({
    calendar: z.enum(calendars),
    year: z.int(),
    month: z.int().optional(),
    day: z.int().optional(),
  })
  .refine((date): date is CalendarDate => sortValue(date) !== null, 'This date does not exist in its calendar');

/** Erişim tarihi is always Milâdî (#18 §4). */
const fieldDate = (key: SourceField) =>
  key === 'accessDate' ? calendarDate.refine((date) => date.calendar === 'gregorian', 'Always Milâdî') : calendarDate;

/**
 * Type-specific fields by key: the filled ones and the ones the scholar
 * cleared, a text field with a blank and a Date field with null.
 */
const fieldsPatch = z
  .strictObject(
    Object.fromEntries(
      sourceFields.map((key) => [key, (isSourceDateField(key) ? fieldDate(key).nullable() : z.string()).optional()]),
    ) as Record<SourceField, z.ZodOptional<z.ZodString | z.ZodNullable<typeof calendarDate>>>,
  )
  .transform((values) => {
    const entries = Object.entries(values) as [SourceField, string | CalendarDate | null][];
    return {
      filled: Object.fromEntries(entries.filter(([, value]) => isFilled(value))) as SourceFieldValues,
      cleared: entries.filter(([, value]) => !isFilled(value)).map(([key]) => key),
    };
  });

const sourceInput = z.object({
  type: z.enum(sourceTypes),
  title: z.string().trim().min(1),
  author: optionalText,
  isbn: optionalText,
  doi: optionalText,
  bibliographicNote: optionalText,
  /** Null empties it; left out (in an update) leaves it unchanged. */
  date: calendarDate.nullish(),
  fields: fieldsPatch.optional(),
});

/** The Date's columns: as entered, and the value that orders it. */
const dateColumns = (date: CalendarDate | null | undefined) =>
  date === undefined ? {} : { date, dateSort: date && sortValue(date) };

const sourceColumns = {
  id: source.id,
  type: source.type,
  title: source.title,
  author: source.author,
  isbn: source.isbn,
  doi: source.doi,
  bibliographicNote: source.bibliographicNote,
  date: source.date,
  fields: source.fields,
};

export const sourcesRouter = router({
  /** What Ana sayfa needs; while the Library is empty it shows "İlk kaynağını ekle". */
  home: libraryProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.tx.select({ sourceCount: count() }).from(source).where(eq(source.accountId, ctx.accountId));
    return { sourceCount: row?.sourceCount ?? 0 };
  }),

  /**
   * The Kaynaklar list, by Başlık, by Yazar or by Tarih (oldest first, across
   * calendars); Sources without a Yazar or a Tarih come last.
   */
  list: libraryProcedure
    .input(z.object({ sort: z.enum(['title', 'author', 'date']) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.tx
        .select({
          id: source.id,
          type: source.type,
          title: source.title,
          author: source.author,
          date: source.date,
          dateSort: source.dateSort,
        })
        .from(source)
        .where(eq(source.accountId, ctx.accountId));
      type Row = (typeof rows)[number];
      const byTitle = (a: Row, b: Row) => compareTr(a.title, b.title);
      const lastWhenNull = <T>(a: T | null, b: T | null, compare: (a: T, b: T) => number) => {
        if (a === null) return b === null ? 0 : 1;
        if (b === null) return -1;
        return compare(a, b);
      };
      const order: Record<typeof input.sort, (a: Row, b: Row) => number> = {
        title: byTitle,
        author: (a, b) => lastWhenNull(a.author, b.author, compareTr) || byTitle(a, b),
        date: (a, b) => lastWhenNull(a.dateSort, b.dateSort, (x, y) => x - y) || byTitle(a, b),
      };
      return rows.sort(order[input.sort]).map(({ dateSort: _, ...row }) => row);
    }),

  /**
   * Capture's Source list and its default (the first): the Source with the
   * latest Note first, then those without Notes, newest first. Note and
   * Source ids are UUIDv7, so id order is time order.
   */
  byLastNote: libraryProcedure.query(async ({ ctx }) => {
    const lastNote = sql`(select ${note.id} from ${note}
        where ${note.sourceId} = ${source.id} and ${note.accountId} = ${ctx.accountId}
        order by ${note.id} desc limit 1)`;
    return ctx.tx
      .select({ id: source.id, type: source.type, title: source.title, author: source.author })
      .from(source)
      .where(eq(source.accountId, ctx.accountId))
      .orderBy(sql`${lastNote} desc nulls last`, desc(source.id));
  }),

  /** Ana sayfa's "Son not aldığın": the latest Note and its Source, or null before the first Note. */
  lastNoted: libraryProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.tx
      .select({
        source: { id: source.id, type: source.type, title: source.title, author: source.author, date: source.date },
        note: {
          id: note.id,
          locator: note.locator,
          excerpt: note.excerpt,
          comment: note.comment,
          capturedAt: note.createdAt,
        },
      })
      .from(note)
      .innerJoin(source, and(eq(source.id, note.sourceId), eq(source.accountId, ctx.accountId)))
      .where(eq(note.accountId, ctx.accountId))
      .orderBy(desc(note.id))
      .limit(1);
    // A string, as the app receives it over JSON.
    return row ? { ...row, note: { ...row.note, capturedAt: row.note.capturedAt.toISOString() } } : null;
  }),

  create: libraryProcedure.input(sourceInput).mutation(async ({ ctx, input }) => {
    const id = uuidv7();
    const { fields: patch, date, ...columns } = input;
    await ctx.tx
      .insert(source)
      .values({ ...columns, ...dateColumns(date), fields: patch?.filled, id, accountId: ctx.accountId });
    return { id };
  }),

  /**
   * Changes only what the call names. A type change never drops a field: the
   * fields the new type lacks stay stored and come back with the old type.
   */
  update: libraryProcedure.input(sourceInput.partial().extend({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { id, fields: patch, date, ...columns } = input;
    const [row] = await ctx.tx
      .update(source)
      .set({
        ...columns,
        ...dateColumns(date),
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
