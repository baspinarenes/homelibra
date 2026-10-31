import { compareTr } from '@homelibra/core';
import { TRPCError } from '@trpc/server';
import { and, eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';

import { collectionDefinition, tagsOfCollection, tagsOfCollections } from '../collections/definition';
import { collectionView, memberCount } from '../collections/view';
import { account, collection, collectionTag, tag } from '../db/schema';
import { findTags, resolveTags, setTags, tagNames } from '../tags/tags';
import { libraryProcedure, router } from '../trpc/init';
import { deleteWithUndo } from '../undo/delete';

const collectionName = z.string().trim().min(1).max(200);

/** The Collection with this id, when it is in this Library. */
const myCollection = (accountId: string, id: string) => and(eq(collection.id, id), eq(collection.accountId, accountId));

export const collectionsRouter = router({
  /**
   * "+ Yeni dosya", and "Dosya yap" on a Tag's page (the same name
   * and Tag). "Etiketli kaynakların tüm notları" is on unless said otherwise.
   */
  create: libraryProcedure
    .input(z.object({ name: collectionName, tags: tagNames, includeSourceNotes: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = uuidv7();
      const now = ctx.now();
      await ctx.tx.insert(collection).values({
        id,
        accountId: ctx.accountId,
        name: input.name,
        includeSourceNotes: input.includeSourceNotes,
        // On the API's clock, as every later change is: Son değişen compares them.
        createdAt: now,
        updatedAt: now,
      });
      await setTags(ctx.tx, ctx.accountId, collectionTag, id, await resolveTags(ctx.tx, ctx.accountId, input.tags));
      return { id };
    }),

  /**
   * Dosyalar: every Collection with its Tags and how many Notes its view
   * shows now. Sırala: Son değişen (its name, Tags or switch, not a Note
   * that came into its view), Ada göre (A–Z, unless said otherwise), or Not
   * sayısı (most first); a tie A–Z.
   */
  list: libraryProcedure
    .input(z.object({ sort: z.enum(['recent', 'name', 'notes']) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.tx
        .select({ id: collection.id, name: collection.name, updatedAt: collection.updatedAt, noteCount: memberCount })
        .from(collection)
        .where(eq(collection.accountId, ctx.accountId));
      type Row = (typeof rows)[number];
      const byName = (a: Row, b: Row) => compareTr(a.name, b.name);
      const order: Record<NonNullable<typeof input>['sort'], (a: Row, b: Row) => number> = {
        recent: (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime() || byName(a, b),
        name: byName,
        notes: (a, b) => b.noteCount - a.noteCount || byName(a, b),
      };
      const tags = await tagsOfCollections(ctx.tx, ctx.accountId);
      return rows
        .sort(order[input?.sort ?? 'name'])
        .map(({ updatedAt: _, noteCount, ...row }) => ({ ...row, tags: tags.get(row.id) ?? [], noteCount }));
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
    await setTags(ctx.tx, ctx.accountId, collectionTag, input.id, tagIds);
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
  delete: libraryProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { undoToken } = await deleteWithUndo(ctx.tx, ctx.accountId, ctx.now(), { collections: [input.id] });
    return { undoToken };
  }),

  /**
   * "Markdown olarak kopyala" happened: the app builds the copy itself and
   * sends this on the side, unawaited. One counter per Account (#40).
   */
  copied: libraryProcedure.mutation(async ({ ctx }) => {
    await ctx.tx
      .update(account)
      .set({ markdownCopies: sql`${account.markdownCopies} + 1` })
      .where(eq(account.id, ctx.accountId));
  }),

  /** The Collection's definition and its view, worked out now (#3). */
  view: libraryProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const found = await collectionDefinition(ctx.tx, ctx.accountId, input.id);
    return { ...found, ...(await collectionView(ctx.tx, ctx.accountId, found)) };
  }),

  /**
   * Yeni dosya, before it is saved: the counts `view` would give a
   * Collection of these Tags and this switch. A name the Library has no Tag
   * of brings nothing; nothing is made.
   */
  preview: libraryProcedure
    .input(z.object({ tags: tagNames, includeSourceNotes: z.boolean() }))
    .query(async ({ ctx, input }) => {
      const tags = await findTags(ctx.tx, ctx.accountId, input.tags);
      const { noteCount, sourceCount, sourceOnlyCount } = await collectionView(ctx.tx, ctx.accountId, {
        tags,
        includeSourceNotes: input.includeSourceNotes,
      });
      return { noteCount, sourceCount, sourceOnlyCount };
    }),

  /**
   * A Tag's page: the same view of that one Tag, saved nowhere. Its switch
   * lives on the page; "Dosya yap" is `create` with the Tag's name.
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
