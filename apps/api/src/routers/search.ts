import type { CalendarDate } from '@homelibra/core/date';
import type { SourceType } from '@homelibra/core/source';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { type Segment, snippet } from '../search/snippet';
import { libraryProcedure, router } from '../trpc/init';

/** How a result matched its worst query word: the tiers of the search contract (ADR-0005). */
export type Match = 'exact' | 'stem' | 'prefix' | 'part';

// hl_search_*'s tiers. 0 is exact in its spelling too, which only orders within exact.
const matchOf = (tier: number): Match => (tier <= 1 ? 'exact' : tier === 2 ? 'stem' : tier === 3 ? 'prefix' : 'part');

/** Notes per page of results; the app asks for the next page as the scholar scrolls. */
export const NOTE_PAGE = 50;

export const searchRouter = router({
  /**
   * Searches the whole Library by the words of Notes (Excerpt and Comment)
   * and Sources (Başlık, Yazar, Künye notu, type-specific fields). The query
   * goes to the database as typed; all folding and parsing happen there
   * (ADR-0010). Locator, Tags and Date are not searched. Every match is
   * returned, a page of Notes at a time: `cursor` is how many came before.
   * Sources come with the first page only.
   */
  library: libraryProcedure
    .input(z.object({ query: z.string().max(500), cursor: z.int().nonnegative().nullish() }))
    .query(async ({ ctx, input }) => {
      const { query } = input;
      const offset = input.cursor ?? 0;
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
            }>(sql`
      select s.id, h.tier, s.type, s.title, s.author, s.date
        from hl_search_sources(${query}, ${ctx.accountId}) h
        join source s on s.id = h.source_id
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
       order by h.rnk
       limit ${NOTE_PAGE} offset ${offset}`);
      const noteTotal = notes[0]?.total ?? 0;
      return {
        sources: sources.map(({ tier, ...row }) => ({ ...row, match: matchOf(tier) })),
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
      };
    }),
});
