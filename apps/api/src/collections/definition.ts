import { compareTr } from '@homelibra/core';
import { and, eq, notInArray } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { collectionTag, tag } from '../db/schema';
import type { TagRef } from '../tags/tags';

/**
 * Leaves exactly these Tags in the Collection's definition. New ones go in
 * before old ones go, so a Tag that stays is never left unused on the way;
 * one let go that nothing else uses goes (0014_collections).
 */
export async function setCollectionTags(tx: LibraryTx, accountId: string, collectionId: string, tagIds: string[]) {
  if (tagIds.length > 0)
    await tx
      .insert(collectionTag)
      .values(tagIds.map((tagId) => ({ collectionId, tagId, accountId })))
      .onConflictDoNothing();
  await tx
    .delete(collectionTag)
    .where(
      and(
        eq(collectionTag.collectionId, collectionId),
        eq(collectionTag.accountId, accountId),
        tagIds.length > 0 ? notInArray(collectionTag.tagId, tagIds) : undefined,
      ),
    );
}

/** Every Collection's Tags, A–Z, by Collection; one without any is missing from the map. */
export async function tagsOfCollections(tx: LibraryTx, accountId: string) {
  const rows = await tx
    .select({ collectionId: collectionTag.collectionId, id: tag.id, name: tag.name })
    .from(collectionTag)
    .innerJoin(tag, and(eq(tag.id, collectionTag.tagId), eq(tag.accountId, accountId)))
    .where(eq(collectionTag.accountId, accountId));
  const byCollection = new Map<string, TagRef[]>();
  for (const { collectionId, ...ref } of rows)
    byCollection.set(collectionId, [...(byCollection.get(collectionId) ?? []), ref]);
  for (const refs of byCollection.values()) refs.sort((a, b) => compareTr(a.name, b.name));
  return byCollection;
}

/** The Tags of a Collection's definition, A–Z. */
export async function tagsOfCollection(tx: LibraryTx, accountId: string, collectionId: string): Promise<TagRef[]> {
  const rows = await tx
    .select({ id: tag.id, name: tag.name })
    .from(collectionTag)
    .innerJoin(tag, and(eq(tag.id, collectionTag.tagId), eq(tag.accountId, accountId)))
    .where(and(eq(collectionTag.collectionId, collectionId), eq(collectionTag.accountId, accountId)));
  return rows.sort((a, b) => compareTr(a.name, b.name));
}
