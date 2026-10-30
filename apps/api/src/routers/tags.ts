import { compareTr } from '@homelibra/core';
import { tagIdentity } from '@homelibra/core/tag';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import type { LibraryTx } from '../db/client';
import { collectionTag, noteTag, source, sourceTag, tag } from '../db/schema';
import { tagParts } from '../tags/snapshot';
import { mergeTag, resolveTags, setSourceTags, tagNameInput, tagNames, tagsOfSource } from '../tags/tags';
import { libraryProcedure, router } from '../trpc/init';
import { recordUndo } from '../undo/undo';
import { mySource } from '../sources/sources';

export const tagsRouter = router({
  /**
   * Every Tag in the Library with how many Notes and Sources carry it
   * ("N not · M kaynak"): A–Z, Çok kullanılan (most carriers first), or
   * last put on first (Ana sayfa's "son kullanılan"). The Tag picker
   * suggests from the same list.
   */
  list: libraryProcedure
    .input(z.object({ sort: z.enum(['name', 'usage', 'recent']), limit: z.int().positive().optional() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.tx
        .select({
          id: tag.id,
          name: tag.name,
          noteCount: sql<number>`(select count(*) from ${noteTag} where ${noteTag.tagId} = ${tag.id} and ${noteTag.accountId} = ${ctx.accountId})::int`,
          sourceCount: sql<number>`(select count(*) from ${sourceTag} where ${sourceTag.tagId} = ${tag.id} and ${sourceTag.accountId} = ${ctx.accountId})::int`,
          lastUsed: sql<string>`greatest(
            (select max(${noteTag.createdAt}) from ${noteTag} where ${noteTag.tagId} = ${tag.id} and ${noteTag.accountId} = ${ctx.accountId}),
            (select max(${sourceTag.createdAt}) from ${sourceTag} where ${sourceTag.tagId} = ${tag.id} and ${sourceTag.accountId} = ${ctx.accountId}),
            (select max(${collectionTag.createdAt}) from ${collectionTag} where ${collectionTag.tagId} = ${tag.id} and ${collectionTag.accountId} = ${ctx.accountId}))`,
        })
        .from(tag)
        .where(eq(tag.accountId, ctx.accountId));
      type Row = (typeof rows)[number];
      const byName = (a: Row, b: Row) => compareTr(a.name, b.name);
      const order: Record<typeof input.sort, (a: Row, b: Row) => number> = {
        name: byName,
        usage: (a, b) => b.noteCount + b.sourceCount - (a.noteCount + a.sourceCount) || byName(a, b),
        recent: (a, b) => Date.parse(b.lastUsed) - Date.parse(a.lastUsed) || byName(a, b),
      };
      return rows
        .sort(order[input.sort])
        .slice(0, input.limit)
        .map(({ lastUsed: _, ...row }) => row);
    }),

  /**
   * Leaves exactly these Tags on the Source, from the Source page's heading.
   * The Source's Notes keep only their own Tags (ADR-0003); a Tag left with
   * nothing carrying it goes.
   */
  setOnSource: libraryProcedure
    .input(z.object({ sourceId: z.uuid(), names: tagNames }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.tx.select({ id: source.id }).from(source).where(mySource(ctx.accountId, input.sourceId));
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      const tagIds = await resolveTags(ctx.tx, ctx.accountId, input.names);
      await setSourceTags(ctx.tx, ctx.accountId, input.sourceId, tagIds);
      return tagsOfSource(ctx.tx, ctx.accountId, input.sourceId);
    }),

  /**
   * Yeniden adlandır, from the ⋯ menu of Etiketler: the Tag takes the new
   * name everywhere at once, since its carriers point at it. A name of the
   * same identity only corrects the spelling. A name that is another Tag's
   * identity changes nothing and answers `merge` with that Tag: the app asks,
   * then calls `merge` (#3).
   */
  rename: libraryProcedure.input(z.object({ id: z.uuid(), name: tagNameInput })).mutation(async ({ ctx, input }) => {
    const current = await myTag(ctx.tx, ctx.accountId, input.id);
    const identity = tagIdentity(input.name);
    if (identity !== current.identity) {
      const [other] = await ctx.tx
        .select({ id: tag.id, name: tag.name })
        .from(tag)
        .where(and(eq(tag.accountId, ctx.accountId), eq(tag.identity, identity)));
      if (other) return { outcome: 'merge' as const, into: other };
    }
    const [renamed] = await ctx.tx
      .update(tag)
      .set({ name: input.name, identity })
      .where(and(eq(tag.id, input.id), eq(tag.accountId, ctx.accountId)))
      .returning({ id: tag.id, name: tag.name });
    return { outcome: 'renamed' as const, tag: renamed! };
  }),

  /**
   * Tag merge, from Birleştir in the ⋯ menu or a confirmed rename onto
   * another Tag's identity: the carriers (Notes, Sources, Collections) go to
   * `intoId`, the merged Tag and its name go. No Geri al (#3, #36).
   * Returns the Tag that stays.
   */
  merge: libraryProcedure.input(z.object({ id: z.uuid(), intoId: z.uuid() })).mutation(async ({ ctx, input }) => {
    if (input.id === input.intoId) throw new TRPCError({ code: 'BAD_REQUEST' });
    // Locked in one order, so two merges of the same pair cannot deadlock.
    const [first, second] = [input.id, input.intoId].sort();
    const locked = [await myTag(ctx.tx, ctx.accountId, first!), await myTag(ctx.tx, ctx.accountId, second!)];
    const into = locked.find((row) => row.id === input.intoId)!;
    await mergeTag(ctx.tx, ctx.accountId, input.id, input.intoId);
    return { id: into.id, name: into.name };
  }),

  /**
   * What Sil in the ⋯ menu asks with: how many Notes and Sources carry the
   * Tag themselves and how many Collections use it ("'kadı' 212 nottan, 3
   * kaynaktan ve 2 dosyadan kaldırılacak"). A Source's Tag is not on its
   * Notes (ADR-0003).
   */
  deleteImpact: libraryProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .select({
        name: tag.name,
        notes: sql<number>`(select count(*) from ${noteTag} where ${noteTag.tagId} = ${tag.id} and ${noteTag.accountId} = ${ctx.accountId})::int`,
        sources: sql<number>`(select count(*) from ${sourceTag} where ${sourceTag.tagId} = ${tag.id} and ${sourceTag.accountId} = ${ctx.accountId})::int`,
        collections: sql<number>`(select count(*) from ${collectionTag} where ${collectionTag.tagId} = ${tag.id} and ${collectionTag.accountId} = ${ctx.accountId})::int`,
      })
      .from(tag)
      .where(and(eq(tag.id, input.id), eq(tag.accountId, ctx.accountId)));
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    return row;
  }),

  /**
   * Tag sil, once confirmed: the Tag comes off every Note, Source and
   * Collection and goes. The token takes it back with all its links (Geri
   * al). A Tag already gone changes nothing and offers no Geri al.
   */
  delete: libraryProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .select({ id: tag.id })
      .from(tag)
      .where(and(eq(tag.id, input.id), eq(tag.accountId, ctx.accountId)))
      .for('update');
    if (!row) return { undoToken: null };
    // Read first: the links go with the Tag.
    const parts = await tagParts(ctx.tx, ctx.accountId, { tagIds: [input.id] });
    await ctx.tx.delete(tag).where(and(eq(tag.id, input.id), eq(tag.accountId, ctx.accountId)));
    const undoToken = await recordUndo(ctx.tx, ctx.accountId, ctx.now(), { reinsert: parts });
    return { undoToken };
  }),
});

/** The Library's Tag, locked for the operation; NOT_FOUND when it is gone or never was this Library's. */
async function myTag(tx: LibraryTx, accountId: string, id: string) {
  const [row] = await tx
    .select({ id: tag.id, name: tag.name, identity: tag.identity })
    .from(tag)
    .where(and(eq(tag.id, id), eq(tag.accountId, accountId)))
    .for('update');
  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
  return row;
}
