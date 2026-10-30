import { compareTr } from '@homelibra/core';
import { tagIdentity, tagName } from '@homelibra/core/tag';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';

import type { LibraryTx } from '../db/client';
import { noteTag, sourceTag, tag } from '../db/schema';

/** A Tag's name as the picker sends it: trimmed, without a leading #, never empty. */
export const tagNames = z.array(z.string().transform(tagName).pipe(z.string().min(1).max(200))).max(100);

export type TagRef = { id: string; name: string };

/**
 * The Tags these names are, made where the Library has none of that identity
 * yet. A Tag keeps the spelling it was first entered with. In the order
 * given, one per identity.
 */
export async function resolveTags(tx: LibraryTx, accountId: string, names: string[]): Promise<string[]> {
  const byIdentity = new Map<string, string>();
  for (const name of names) {
    const identity = tagIdentity(name);
    if (!byIdentity.has(identity)) byIdentity.set(identity, name);
  }
  if (byIdentity.size === 0) return [];
  const rows = await tx
    .insert(tag)
    .values([...byIdentity].map(([identity, name]) => ({ id: uuidv7(), accountId, name, identity })))
    // The Tag already there is returned as it is; touching it locks it
    // against its last link going away in another transaction meanwhile.
    .onConflictDoUpdate({ target: [tag.accountId, tag.identity], set: { identity: sql`excluded.identity` } })
    .returning({ id: tag.id, identity: tag.identity });
  const ids = new Map(rows.map((row) => [row.identity, row.id]));
  return [...byIdentity.keys()].map((identity) => ids.get(identity)!);
}

/** Puts these Tags on the Note too; the ones it has stay. */
export async function addNoteTags(tx: LibraryTx, accountId: string, noteId: string, tagIds: string[]) {
  if (tagIds.length === 0) return;
  await tx
    .insert(noteTag)
    .values(tagIds.map((tagId) => ({ noteId, tagId, accountId })))
    .onConflictDoNothing();
}

/**
 * Leaves exactly these Tags on the Note. New links go in before old ones go,
 * so a Tag that stays is never left unused on the way, which would drop it.
 */
export async function setNoteTags(tx: LibraryTx, accountId: string, noteId: string, tagIds: string[]) {
  await addNoteTags(tx, accountId, noteId, tagIds);
  await tx
    .delete(noteTag)
    .where(
      and(
        eq(noteTag.noteId, noteId),
        eq(noteTag.accountId, accountId),
        tagIds.length > 0 ? notInArray(noteTag.tagId, tagIds) : undefined,
      ),
    );
}

/** Leaves exactly these Tags on the Source; its Notes are not touched (ADR-0003). */
export async function setSourceTags(tx: LibraryTx, accountId: string, sourceId: string, tagIds: string[]) {
  if (tagIds.length > 0)
    await tx
      .insert(sourceTag)
      .values(tagIds.map((tagId) => ({ sourceId, tagId, accountId })))
      .onConflictDoNothing();
  await tx
    .delete(sourceTag)
    .where(
      and(
        eq(sourceTag.sourceId, sourceId),
        eq(sourceTag.accountId, accountId),
        tagIds.length > 0 ? notInArray(sourceTag.tagId, tagIds) : undefined,
      ),
    );
}

const byName = (a: TagRef, b: TagRef) => compareTr(a.name, b.name);

/** Each Note's own Tags, A–Z; a Note without any is missing from the map. */
export async function tagsOfNotes(tx: LibraryTx, accountId: string, noteIds: string[]) {
  const byNote = new Map<string, TagRef[]>();
  if (noteIds.length === 0) return byNote;
  const rows = await tx
    .select({ noteId: noteTag.noteId, id: tag.id, name: tag.name })
    .from(noteTag)
    .innerJoin(tag, and(eq(tag.id, noteTag.tagId), eq(tag.accountId, accountId)))
    .where(and(inArray(noteTag.noteId, noteIds), eq(noteTag.accountId, accountId)));
  for (const { noteId, ...ref } of rows) byNote.set(noteId, [...(byNote.get(noteId) ?? []), ref]);
  for (const refs of byNote.values()) refs.sort(byName);
  return byNote;
}

/** The Source's own Tags, A–Z. */
export async function tagsOfSource(tx: LibraryTx, accountId: string, sourceId: string): Promise<TagRef[]> {
  const rows = await tx
    .select({ id: tag.id, name: tag.name })
    .from(sourceTag)
    .innerJoin(tag, and(eq(tag.id, sourceTag.tagId), eq(tag.accountId, accountId)))
    .where(and(eq(sourceTag.sourceId, sourceId), eq(sourceTag.accountId, accountId)));
  return rows.sort(byName);
}
