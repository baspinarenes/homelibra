import { compareTr } from '@homelibra/core';
import { tagIdentity, tagName } from '@homelibra/core/tag';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';

import type { LibraryTx } from '../db/client';
import { collectionTag, noteTag, sourceTag, tag } from '../db/schema';

/** A Tag's name as the picker sends it: trimmed, without a leading #, never empty. */
export const tagNameInput = z.string().transform(tagName).pipe(z.string().min(1).max(200));
export const tagNames = z.array(tagNameInput).max(100);

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
 * The tables linking a carrier to a Tag, with the carrier's column: Notes,
 * Sources and Collections. A Tag merge moves every one of them, and a Tag
 * snapshot reads and restores them (tags/snapshot.ts).
 */
export const linkTables = [
  { table: noteTag, carrier: noteTag.noteId },
  { table: sourceTag, carrier: sourceTag.sourceId },
  { table: collectionTag, carrier: collectionTag.collectionId },
] as const;

export type LinkTable = (typeof linkTables)[number]['table'];

/** The carrier's column of a link table. */
export const carrierOf = (table: LinkTable) => linkTables.find((link) => link.table === table)!.carrier;

/**
 * Leaves exactly these Tags on a Note, Source or Collection (`carrierId`,
 * through `table`, its link table). New links go in before old ones go, so
 * a Tag that stays is never left unused on the way, which would drop it.
 */
export async function setTags(tx: LibraryTx, accountId: string, table: LinkTable, carrierId: string, tagIds: string[]) {
  const carrier = carrierOf(table);
  if (tagIds.length > 0) {
    const rows = sql.join(
      tagIds.map((tagId) => sql`(${carrierId}, ${tagId}, ${accountId})`),
      sql`, `,
    );
    await tx.execute(
      sql`insert into ${table} (${sql.raw(carrier.name)}, tag_id, account_id) values ${rows} on conflict do nothing`,
    );
  }
  await tx
    .delete(table)
    .where(
      and(
        eq(carrier, carrierId),
        eq(table.accountId, accountId),
        tagIds.length > 0 ? notInArray(table.tagId, tagIds) : undefined,
      ),
    );
}

/**
 * Tag merge (#3): every Note, Source and Collection using `fromId` uses
 * `intoId` instead, as from when it first did; one that used both keeps its
 * one link. Then `fromId` goes, and its name with it.
 */
export async function mergeTag(tx: LibraryTx, accountId: string, fromId: string, intoId: string) {
  for (const { table, carrier } of linkTables) {
    const column = sql.raw(carrier.name);
    await tx.execute(sql`
      update ${table} l set tag_id = ${intoId}
       where l.tag_id = ${fromId} and l.account_id = ${accountId}
         and not exists (select from ${table} x
                          where x.${column} = l.${column} and x.tag_id = ${intoId} and x.account_id = ${accountId})`);
  }
  // Takes the links left (to carriers that had both) with it.
  await tx.delete(tag).where(and(eq(tag.id, fromId), eq(tag.accountId, accountId)));
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
