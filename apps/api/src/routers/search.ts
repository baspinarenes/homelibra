import type { CalendarDate } from '@homelibra/core/date';
import type { SourceType } from '@homelibra/core/source';
import { TRPCError } from '@trpc/server';
import { and, eq, type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';

import { collectionDefinition } from '../collections/definition';
import { viewNoteIds } from '../collections/view';
import { coverOf } from '../covers/covers';
import type { LibraryTx } from '../db/client';
import { source, tag } from '../db/schema';
import { dateFilter, inDates } from '../search/dates';
import { joined, type Segment, snippet } from '../search/snippet';
import { mySource } from '../sources/sources';
import { libraryProcedure, router } from '../trpc/init';

/** How a result matched its worst query word: the tiers of the search contract (ADR-0005). */
export type Match = 'exact' | 'stem' | 'prefix' | 'part';

// hl_search_*'s tiers. 0 is exact in its spelling too, which only orders within exact.
const matchOf = (tier: number): Match => (tier <= 1 ? 'exact' : tier === 2 ? 'stem' : tier === 3 ? 'prefix' : 'part');

/** Notes per page of results; the app asks for the next page as the scholar scrolls. */
export const NOTE_PAGE = 50;

const queryText = z.string().max(500);

/**
 * The Notes `n` (an SQL alias of note) within `scope` that match the query,
 * best first, by the same functions as the Library search: the rules are
 * the same wherever the box is (#40, story 156). Each comes with its whole
 * Excerpt and Comment, the matching words marked, for a list that shows
 * the Notes themselves rather than a part of them.
 */
async function notesIn(tx: LibraryTx, accountId: string, q: string, scope: SQL) {
  const rows = await tx.execute<{
    id: string;
    tier: number;
    excerpt_marks: Segment[] | null;
    comment_marks: Segment[] | null;
  }>(sql`
      select n.id, h.tier,
             hl_marks(n.excerpt, ${q}) as excerpt_marks,
             hl_marks(n.comment, ${q}) as comment_marks
        from hl_search_notes(${q}, ${accountId}) h
        join note n on n.id = h.note_id
       where ${scope}
       order by h.rnk`);
  return {
    notes: rows.map((row) => ({
      id: row.id,
      match: matchOf(row.tier),
      excerpt: row.excerpt_marks && joined(row.excerpt_marks),
      comment: row.comment_marks && joined(row.comment_marks),
    })),
  };
}

export const searchRouter = router({
  /**
   * Searches the whole Library by the words of Notes (Excerpt and Comment)
   * and Sources (Başlık, Yazar, Künye notu, type-specific fields). The query
   * goes to the database as typed; all folding and parsing happen there
   * (ADR-0010). Locator, Tags and Date are not searched. Every match is
   * returned, a page of Notes at a time: `cursor` is how many came before.
   * Sources come with the first page only.
   *
   * The Tarih filter keeps the Sources, and the Notes whose Source, dated
   * in the years asked; with the first page come how many matches it hid
   * for having no Date (#40, story 154).
   */
  library: libraryProcedure
    .input(z.object({ query: queryText, cursor: z.int().nonnegative().nullish(), dates: dateFilter.nullish() }))
    .query(async ({ ctx, input }) => {
      const { query } = input;
      const offset = input.cursor ?? 0;
      const dated = inDates(input.dates, sql`s.date_sort`);
      const kept = dated ?? sql`true`;
      const sources =
        offset > 0
          ? []
          : await ctx.tx.execute<{
              id: string;
              tier: number;
              type: SourceType;
              title: string;
              author: string | null;
              date: CalendarDate | null;
              coverKeyLarge: string | null;
              coverKeySmall: string | null;
            }>(sql`
      select s.id, h.tier, s.type, s.title, s.author, s.date,
             s.cover_key_large as "coverKeyLarge", s.cover_key_small as "coverKeySmall"
        from hl_search_sources(${query}, ${ctx.accountId}) h
        join source s on s.id = h.source_id
       where ${kept}
       order by h.rnk`);
      const notes = await ctx.tx.execute<{
        id: string;
        tier: number;
        source_id: string;
        title: string;
        author: string | null;
        locator: string | null;
        excerpt_marks: Segment[] | null;
        comment_marks: Segment[] | null;
        total: number;
      }>(sql`
      select n.id, h.tier, n.source_id, s.title, s.author, n.locator,
             hl_marks(n.excerpt, ${query}) as excerpt_marks,
             hl_marks(n.comment, ${query}) as comment_marks,
             count(*) over ()::int as total
        from hl_search_notes(${query}, ${ctx.accountId}) h
        join note n on n.id = h.note_id
        join source s on s.id = n.source_id
       where ${kept}
       order by h.rnk
       limit ${NOTE_PAGE} offset ${offset}`);
      const noteTotal = notes[0]?.total ?? 0;
      const [hiddenUndated = { sources: 0, notes: 0 }] =
        dated && offset === 0
          ? await ctx.tx.execute<{ sources: number; notes: number }>(sql`
      select (select count(*) from hl_search_sources(${query}, ${ctx.accountId}) h
                join source s on s.id = h.source_id
               where s.date_sort is null)::int as sources,
             (select count(*) from hl_search_notes(${query}, ${ctx.accountId}) h
                join note n on n.id = h.note_id
                join source s on s.id = n.source_id
               where s.date_sort is null)::int as notes`)
          : [];
      return {
        sources: sources.map(({ tier, ...row }) => ({ ...coverOf(row), match: matchOf(tier) })),
        notes: notes.map((row) => {
          // The part shown comes from the Excerpt unless only the Comment matched.
          const fromComment = !row.excerpt_marks?.some((s) => s.hit) && !!row.comment_marks?.some((s) => s.hit);
          return {
            id: row.id,
            sourceId: row.source_id,
            title: row.title,
            author: row.author,
            locator: row.locator,
            match: matchOf(row.tier),
            fromComment,
            snippet: snippet((fromComment ? row.comment_marks : (row.excerpt_marks ?? row.comment_marks)) ?? []),
          };
        }),
        noteTotal,
        nextCursor: offset + notes.length < noteTotal ? offset + notes.length : null,
        hiddenUndated: { sources: hiddenUndated.sources, notes: hiddenUndated.notes },
      };
    }),

  /** "Bu kaynakta ara": the Source's own Notes that match, by the Library search's rules. */
  source: libraryProcedure.input(z.object({ sourceId: z.uuid(), query: queryText })).query(async ({ ctx, input }) => {
    const [found] = await ctx.tx.select({ id: source.id }).from(source).where(mySource(ctx.accountId, input.sourceId));
    if (!found) throw new TRPCError({ code: 'NOT_FOUND' });
    return notesIn(ctx.tx, ctx.accountId, input.query, sql`n.source_id = ${input.sourceId}`);
  }),

  /**
   * A Collection's search box: the Notes its view shows that match. Nothing
   * is kept in the definition; the app narrows the view it has to these.
   */
  collection: libraryProcedure.input(z.object({ id: z.uuid(), query: queryText })).query(async ({ ctx, input }) => {
    const definition = await collectionDefinition(ctx.tx, ctx.accountId, input.id);
    return notesInView(ctx.tx, ctx.accountId, input.query, await viewNoteIds(ctx.tx, ctx.accountId, definition));
  }),

  /** A Tag page's search box: as a Collection's, for the view of that one Tag with the page's switch. */
  tag: libraryProcedure
    .input(z.object({ tagId: z.uuid(), includeSourceNotes: z.boolean(), query: queryText }))
    .query(async ({ ctx, input }) => {
      const [found] = await ctx.tx
        .select({ id: tag.id, name: tag.name })
        .from(tag)
        .where(and(eq(tag.id, input.tagId), eq(tag.accountId, ctx.accountId)));
      if (!found) throw new TRPCError({ code: 'NOT_FOUND' });
      const ids = await viewNoteIds(ctx.tx, ctx.accountId, {
        tags: [found],
        includeSourceNotes: input.includeSourceNotes,
      });
      return notesInView(ctx.tx, ctx.accountId, input.query, ids);
    }),
});

/** {@link notesIn} the Notes a view shows. */
function notesInView(tx: LibraryTx, accountId: string, q: string, noteIds: string[]) {
  if (noteIds.length === 0) return { notes: [] };
  const ids = sql`array[${sql.join(
    noteIds.map((id) => sql`${id}`),
    sql`, `,
  )}]::uuid[]`;
  return notesIn(tx, accountId, q, sql`n.id = any(${ids})`);
}
