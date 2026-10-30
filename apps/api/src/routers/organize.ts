import { compareTr } from '@homelibra/core';
import { capturedAt } from '@homelibra/core/note';
import { TRPCError } from '@trpc/server';
import { and, eq, getTableName, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

import { coverOf } from '../covers/covers';
import type { LibraryTx } from '../db/client';
import { note, noteTag, source } from '../db/schema';
import { resolveTags, tagNames } from '../tags/tags';
import { libraryProcedure, router } from '../trpc/init';
import { recordUndo } from '../undo/undo';

/**
 * Whether the Note `n` of the Source `s` (SQL aliases) is one Organizing
 * pass waits on: it has no Tag of its own (the Source's do not count,
 * ADR-0003) and came into the Source, captured or moved, after the
 * Source's last "Bitir"; before the first one, every untagged Note. Taking
 * a Tag off an older Note later does not bring it back.
 */
const waiting = (n: string, s: string) =>
  sql.raw(`not exists (select 1 from note_tag nt where nt.note_id = ${n}.id)
    and (${s}.last_finished_at is null or ${n}.entered_source_at > ${s}.last_finished_at)`);

/** How many of the Source's Notes Organizing pass waits on, as Düzenlenecekler counts them. */
export async function waitingCount(tx: LibraryTx, accountId: string, sourceId: string) {
  const [row] = await tx.execute<{ count: number }>(
    sql`select count(*)::int as count from ${note} n
          join ${source} s on s.id = n.source_id and s.account_id = n.account_id
         where n.source_id = ${sourceId} and n.account_id = ${accountId} and ${waiting('n', 's')}`,
  );
  return row?.count ?? 0;
}

type SourceType = (typeof source.$inferSelect)['type'];

/** The Source with this id, when it is in this Library. */
const mySource = (accountId: string, id: string) => and(eq(source.id, id), eq(source.accountId, accountId));

export const organizeRouter = router({
  /**
   * Düzenlenecekler: the Sources with at least one Note waiting, how many,
   * and when their last Note was captured; the finished ones first (marked
   * "bitti"), each part the last noted first.
   */
  list: libraryProcedure.query(async ({ ctx }) => {
    const rows = await ctx.tx.execute<{
      id: string;
      type: SourceType;
      title: string;
      large: string | null;
      small: string | null;
      finished: boolean;
      untagged: number;
      last: string;
    }>(
      sql`select s.id, s.type, s.title, s.cover_key_large as large, s.cover_key_small as small,
                  s.reading_status = 'finished' as finished, w.untagged, l.last
            from ${source} s
            join lateral (select count(*)::int as untagged from ${note} n
                           where n.source_id = s.id and n.account_id = s.account_id and ${waiting('n', 's')}) w
              on w.untagged > 0
            join lateral (select n.id as last from ${note} n
                           where n.source_id = s.id and n.account_id = s.account_id
                           order by n.id desc limit 1) l
              on true
           where s.account_id = ${ctx.accountId}`,
    );
    return [...rows]
      .sort(
        (a, b) =>
          Number(b.finished) - Number(a.finished) ||
          (a.last < b.last ? 1 : a.last > b.last ? -1 : compareTr(a.title, b.title)),
      )
      .map((row) =>
        coverOf({
          id: row.id,
          type: row.type,
          title: row.title,
          coverKeyLarge: row.large,
          coverKeySmall: row.small,
          finished: row.finished,
          untaggedCount: row.untagged,
          lastNoteAt: capturedAt(row.last).toISOString(),
        }),
      );
  }),

  /**
   * What the Source page needs for Organizing pass: "Düzenle · N etiketsiz"
   * (the Notes waiting, as Düzenlenecekler counts them), and the Notes that
   * came in after the last "Bitir", marked "yeni". Before the first "Bitir"
   * no Note is marked: there is nothing yet to be new against.
   */
  source: libraryProcedure.input(z.object({ sourceId: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .select({ lastFinishedAt: source.lastFinishedAt })
      .from(source)
      .where(mySource(ctx.accountId, input.sourceId));
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    const notes = await ctx.tx.execute<{ id: string; fresh: boolean; waiting: boolean }>(
      sql`select n.id,
                 s.last_finished_at is not null and n.entered_source_at > s.last_finished_at as fresh,
                 ${waiting('n', 's')} as waiting
            from ${note} n
            join ${source} s on s.id = n.source_id and s.account_id = n.account_id
           where n.source_id = ${input.sourceId} and n.account_id = ${ctx.accountId}`,
    );
    return {
      lastFinishedAt: row.lastFinishedAt?.toISOString() ?? null,
      untaggedCount: notes.filter((n) => n.waiting).length,
      newNoteIds: notes.filter((n) => n.fresh).map((n) => n.id),
    };
  }),

  /**
   * "Bitir": writes the moment on the Source, nothing on its Notes. The
   * Source leaves Düzenlenecekler and comes back only with an untagged Note
   * that comes in after this. Saying it with nothing done is fine.
   */
  finish: libraryProcedure.input(z.object({ sourceId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .update(source)
      .set({ lastFinishedAt: ctx.now() })
      .where(mySource(ctx.accountId, input.sourceId))
      .returning({ id: source.id });
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
  }),

  /**
   * Toplu etiket, from Düzenle mode's selection: these Tags go on every
   * selected Note too; the ones a Note has stay. Geri al takes off only the
   * links this added (a Tag it made goes with them). There is no bulk
   * taking off. Notes not in this Library, or deleted meanwhile, are
   * skipped; with none left, nothing happens and there is no Geri al.
   */
  tag: libraryProcedure
    .input(z.object({ noteIds: z.array(z.uuid()).min(1).max(1000), names: tagNames.min(1) }))
    .mutation(async ({ ctx, input }) => {
      const notes = await ctx.tx
        .select({ id: note.id })
        .from(note)
        .where(and(inArray(note.id, input.noteIds), eq(note.accountId, ctx.accountId)));
      if (notes.length === 0) return { undoToken: null };
      // Every Tag made here gets a link below, so none is left unused.
      const tagIds = await resolveTags(ctx.tx, ctx.accountId, input.names);
      const added = await ctx.tx
        .insert(noteTag)
        .values(notes.flatMap(({ id }) => tagIds.map((tagId) => ({ noteId: id, tagId, accountId: ctx.accountId }))))
        .onConflictDoNothing()
        .returning({ noteId: noteTag.noteId, tagId: noteTag.tagId });
      if (added.length === 0) return { undoToken: null };
      const undoToken = await recordUndo(ctx.tx, ctx.accountId, ctx.now(), {
        remove: {
          [getTableName(noteTag)]: added.map(({ noteId, tagId }) => ({
            note_id: noteId,
            tag_id: tagId,
          })),
        },
      });
      return { undoToken };
    }),
});
