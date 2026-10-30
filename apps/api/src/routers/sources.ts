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
import { capturedAt } from '@homelibra/core/note';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';

import { coverColumns, coverOf } from '../covers/covers';
import { note, source } from '../db/schema';
import { waiting, waitingCount } from '../organize/waiting';
import { dateFilter, inDates } from '../search/dates';
import { mySource } from '../sources/sources';
import { tagParts } from '../tags/snapshot';
import { tagsOfSource } from '../tags/tags';
import { libraryProcedure, router } from '../trpc/init';
import { recordUndo, storedRow } from '../undo/undo';

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
  readingStatus: source.readingStatus,
  ...coverColumns,
};

export const sourcesRouter = router({
  /** What Ana sayfa needs; while the Library is empty it shows "İlk kaynağını ekle". */
  home: libraryProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.tx.select({ sourceCount: count() }).from(source).where(eq(source.accountId, ctx.accountId));
    return { sourceCount: row?.sourceCount ?? 0 };
  }),

  /**
   * The Kaynaklar list, by Son not (the Source noted last first), by Başlık,
   * by Yazar or by Tarih (oldest first, across calendars); Sources without a
   * Note, a Yazar or a Tarih come last. Each with its Reading status (the app
   * splits the list into Okunuyor and Bitti), how many Notes it has, when the
   * last one was captured and how many untagged ones Düzenle waits on
   * ("N etiketsiz"). The Tarih filter keeps only Sources dated in its years
   * (#40, story 164).
   */
  list: libraryProcedure
    .input(z.object({ sort: z.enum(['last', 'title', 'author', 'date']), dates: dateFilter.nullish() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.tx
        .select({
          id: source.id,
          type: source.type,
          title: source.title,
          author: source.author,
          date: source.date,
          dateSort: source.dateSort,
          readingStatus: source.readingStatus,
          ...coverColumns,
          // Spelled out: drizzle leaves a one-table select's columns unqualified.
          noteCount: sql<number>`(select count(*) from ${note} n
                                   where n.source_id = source.id and n.account_id = ${ctx.accountId})::int`,
          lastNoteId: sql<string | null>`(select n.id from ${note} n
                                           where n.source_id = source.id and n.account_id = ${ctx.accountId}
                                           order by n.id desc limit 1)`,
          untaggedCount: sql<number>`(select count(*) from ${note} n
                                       where n.source_id = source.id and n.account_id = ${ctx.accountId}
                                         and ${waiting(ctx.accountId, 'n', 'source')})::int`,
        })
        .from(source)
        .where(and(eq(source.accountId, ctx.accountId), inDates(input.dates, sql`${source.dateSort}`)));
      type Row = (typeof rows)[number];
      const byTitle = (a: Row, b: Row) => compareTr(a.title, b.title);
      const lastWhenNull = <T>(a: T | null, b: T | null, compare: (a: T, b: T) => number) => {
        if (a === null) return b === null ? 0 : 1;
        if (b === null) return -1;
        return compare(a, b);
      };
      const order: Record<typeof input.sort, (a: Row, b: Row) => number> = {
        // UUIDv7 ids sort as their capture times, newest last.
        last: (a, b) =>
          lastWhenNull(a.lastNoteId, b.lastNoteId, (x, y) => (x < y ? 1 : x > y ? -1 : 0)) || byTitle(a, b),
        title: byTitle,
        author: (a, b) => lastWhenNull(a.author, b.author, compareTr) || byTitle(a, b),
        date: (a, b) => lastWhenNull(a.dateSort, b.dateSort, (x, y) => x - y) || byTitle(a, b),
      };
      return rows.sort(order[input.sort]).map(({ dateSort: _, lastNoteId, ...row }) =>
        // A string, as the app receives it over JSON.
        coverOf({ ...row, lastNoteAt: lastNoteId && capturedAt(lastNoteId).toISOString() }),
      );
    }),

  /**
   * Ana sayfa's "Son not aldığın" and "Devam et": the latest Note of a Source
   * being read, and that Source. With no such Note, the latest Note of all
   * rather than nothing; null before the first Note.
   */
  lastNoted: libraryProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.tx
      .select({
        source: {
          id: source.id,
          type: source.type,
          title: source.title,
          author: source.author,
          date: source.date,
          ...coverColumns,
        },
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
      .orderBy(sql`${source.readingStatus} = 'finished'`, desc(note.id))
      .limit(1);
    // A string, as the app receives it over JSON.
    return row
      ? { source: coverOf(row.source), note: { ...row.note, capturedAt: row.note.capturedAt.toISOString() } }
      : null;
  }),

  /**
   * Ana sayfa's Okunuyor: the Sources being read, the last noted first, then
   * the ones without a Note yet, the newest first.
   */
  reading: libraryProcedure.query(async ({ ctx }) => {
    const lastNote = sql<string | null>`max(${note.id}::text)`;
    const rows = await ctx.tx
      .select({
        id: source.id,
        type: source.type,
        title: source.title,
        author: source.author,
        date: source.date,
        ...coverColumns,
        lastNote,
      })
      .from(source)
      .leftJoin(note, and(eq(note.sourceId, source.id), eq(note.accountId, source.accountId)))
      .where(and(eq(source.accountId, ctx.accountId), eq(source.readingStatus, 'reading')))
      .groupBy(source.id)
      .orderBy(sql`${lastNote} desc nulls last`, desc(source.id));
    return rows.map(({ lastNote: last, ...row }) => ({
      ...coverOf(row),
      lastNoteAt: last && capturedAt(last).toISOString(),
    }));
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
      .where(mySource(ctx.accountId, id))
      .returning({ id: source.id });
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return { id };
  }),

  get: libraryProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.tx.select(sourceColumns).from(source).where(mySource(ctx.accountId, input.id));
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return { ...coverOf(row), tags: await tagsOfSource(ctx.tx, ctx.accountId, row.id) };
  }),

  /**
   * The Reading status button on the Source page's heading: okunuyor or
   * bitti, nothing else (no date, no history). Finishing a Source says how
   * many Notes Organizing pass still waits on there, so the app can offer
   * "Şimdi düzenle / Sonra" (#13); otherwise, and when it was finished
   * already, 0.
   */
  setReadingStatus: libraryProcedure
    .input(z.object({ id: z.uuid(), status: z.enum(source.readingStatus.enumValues) }))
    .mutation(async ({ ctx, input }) => {
      const mine = mySource(ctx.accountId, input.id);
      const [before] = await ctx.tx.select({ status: source.readingStatus }).from(source).where(mine).for('update');
      if (!before) throw new TRPCError({ code: 'NOT_FOUND' });
      if (before.status === input.status) return { untaggedCount: 0 };
      await ctx.tx.update(source).set({ readingStatus: input.status, updatedAt: new Date() }).where(mine);
      const finishing = input.status === 'finished';
      return { untaggedCount: finishing ? await waitingCount(ctx.tx, ctx.accountId, input.id) : 0 };
    }),

  /**
   * Kaynağı sil, from the Source form: the Source goes with all its Notes
   * (the app asks first when it has any), and the token brings back the
   * Source and every Note with the same ids (Geri al). Deleting a Source
   * that is already gone changes nothing and offers no Geri al.
   */
  delete: libraryProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const mine = mySource(ctx.accountId, input.id);
    // Read under the lock first: the delete takes the Notes along by cascade.
    const [deleted] = await ctx.tx
      .select({ row: storedRow(source) })
      .from(source)
      .where(mine)
      .for('update');
    if (!deleted) return { undoToken: null };
    const notes = await ctx.tx
      .select({ row: storedRow(note) })
      .from(note)
      .where(and(eq(note.sourceId, input.id), eq(note.accountId, ctx.accountId)));
    // The Source's Tags and its Notes' own, and every Tag they point at.
    const tags = await tagParts(ctx.tx, ctx.accountId, {
      sourceIds: [input.id],
      noteIds: notes.map(({ row }) => row.id as string),
    });
    await ctx.tx.delete(source).where(mine);
    const undoToken = await recordUndo(ctx.tx, ctx.accountId, ctx.now(), {
      reinsert: { source: [deleted.row], note: notes.map(({ row }) => row), ...tags },
    });
    return { undoToken };
  }),
});
