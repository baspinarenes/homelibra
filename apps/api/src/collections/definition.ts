import { compareTr } from '@homelibra/core';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { collection, collectionTag, tag } from '../db/schema';
import type { TagRef } from '../tags/tags';

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

/** A Collection of this Library and its definition: its Tags and its switch. NOT_FOUND when there is none. */
export async function collectionDefinition(tx: LibraryTx, accountId: string, id: string) {
  const [row] = await tx
    .select({ id: collection.id, name: collection.name, includeSourceNotes: collection.includeSourceNotes })
    .from(collection)
    .where(and(eq(collection.id, id), eq(collection.accountId, accountId)));
  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
  return { ...row, tags: await tagsOfCollection(tx, accountId, id) };
}
