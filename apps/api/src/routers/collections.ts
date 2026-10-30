import { compareTr } from '@homelibra/core';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';

import { setCollectionTags, tagsOfCollection, tagsOfCollections } from '../collections/definition';
import { deleteCollection } from '../collections/delete';
import { collectionView, memberCount } from '../collections/view';
import type { LibraryTx } from '../db/client';
import { collection, tag } from '../db/schema';
import { resolveTags, tagNames } from '../tags/tags';
import { libraryProcedure, router } from '../trpc/init';

const collectionName = z.string().trim().min(1).max(200);

/** The Collection with this id, when it is in this Library. */
const myCollection = (accountId: string, id: string) => and(eq(collection.id, id), eq(collection.accountId, accountId));

async function definition(tx: LibraryTx, accountId: string, id: string) {
  const [row] = await tx
    .select({ id: collection.id, name: collection.name, includeSourceNotes: collection.includeSourceNotes })
    .from(collection)
    .where(myCollection(accountId, id));
  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
  return { ...row, tags: await tagsOfCollection(tx, accountId, id) };
}

export const collectionsRouter = router({
  /**
   * "+ Yeni dosya", and "Dosya olarak kaydet" on a Tag's page (the same name
   * and Tag). "Etiketli kaynakların tüm notları" is on unless said otherwise.
   */
  create: libraryProcedure
    .input(z.object({ name: collectionName, tags: tagNames, includeSourceNotes: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = uuidv7();
      await ctx.tx
        .insert(collection)
        .values({ id, accountId: ctx.accountId, name: input.name, includeSourceNotes: input.includeSourceNotes });
      await setCollectionTags(ctx.tx, ctx.accountId, id, await resolveTags(ctx.tx, ctx.accountId, input.tags));
      return { id };
    }),

  /** Dosyalar: every Collection A–Z, with its Tags and how many Notes its view shows now. */
  list: libraryProcedure.query(async ({ ctx }) => {
    const rows = await ctx.tx
      .select({ id: collection.id, name: collection.name, noteCount: memberCount })
      .from(collection)
      .where(eq(collection.accountId, ctx.accountId));
    const tags = await tagsOfCollections(ctx.tx, ctx.accountId);
    return rows
      .sort((a, b) => compareTr(a.name, b.name))
      .map(({ noteCount, ...row }) => ({ ...row, tags: tags.get(row.id) ?? [], noteCount }));
  }),

  rename: libraryProcedure.input(z.object({ id: z.uuid(), name: collectionName })).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .update(collection)
      .set({ name: input.name, updatedAt: ctx.now() })
      .where(myCollection(ctx.accountId, input.id))
      .returning({ id: collection.id });
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
  }),

  /**
   * Leaves exactly these Tags in the definition: the chips' × and "+ etiket".
   * A Tag the Collection let go of and nothing else uses goes.
   */
  setTags: libraryProcedure.input(z.object({ id: z.uuid(), names: tagNames })).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .update(collection)
      .set({ updatedAt: ctx.now() })
      .where(myCollection(ctx.accountId, input.id))
      .returning({ id: collection.id });
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    const tagIds = await resolveTags(ctx.tx, ctx.accountId, input.names);
    await setCollectionTags(ctx.tx, ctx.accountId, input.id, tagIds);
    return tagsOfCollection(ctx.tx, ctx.accountId, input.id);
  }),

  /** The "Etiketli kaynakların tüm notları" switch, kept with the Collection. */
  setIncludeSourceNotes: libraryProcedure
    .input(z.object({ id: z.uuid(), includeSourceNotes: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.tx
        .update(collection)
        .set({ includeSourceNotes: input.includeSourceNotes, updatedAt: ctx.now() })
        .where(myCollection(ctx.accountId, input.id))
        .returning({ id: collection.id });
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    }),

  /**
   * Dosyayı sil, from the Collection's top bar: no confirmation, a Geri al
   * token instead. Notes and Tags stay, but for a Tag only it kept.
   */
  delete: libraryProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => ({
    undoToken: await deleteCollection(ctx.tx, ctx.accountId, input.id, ctx.now()),
  })),

  /** The Collection's definition and its view, worked out now (#3). */
  view: libraryProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const found = await definition(ctx.tx, ctx.accountId, input.id);
    return { ...found, ...(await collectionView(ctx.tx, ctx.accountId, found)) };
  }),

  /**
   * A Tag's page: the same view of that one Tag, saved nowhere. Its switch
   * lives on the page; "Dosya olarak kaydet" is `create` with the Tag's name.
   */
  tagView: libraryProcedure
    .input(z.object({ tagId: z.uuid(), includeSourceNotes: z.boolean() }))
    .query(async ({ ctx, input }) => {
      const [found] = await ctx.tx
        .select({ id: tag.id, name: tag.name })
        .from(tag)
        .where(and(eq(tag.id, input.tagId), eq(tag.accountId, ctx.accountId)));
      if (!found) throw new TRPCError({ code: 'NOT_FOUND' });
      const view = await collectionView(ctx.tx, ctx.accountId, {
        tags: [found],
        includeSourceNotes: input.includeSourceNotes,
      });
      return { tag: found, includeSourceNotes: input.includeSourceNotes, ...view };
    }),
});
