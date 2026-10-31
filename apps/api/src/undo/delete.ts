import { and, eq, getTableName, inArray, or } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { collection, collectionTag, note, noteTag, source, sourceTag, tag } from '../db/schema';
import { type LinkTable, linkTables } from '../tags/tags';
import { storedRow, type StoredRow } from './stored-row';
import { recordUndo, type UndoSnapshot } from './undo';

/** What a Geri al'd delete takes: Sources, Notes, Collections or Tags, by id. */
export type DeleteTarget = { sources: string[] } | { notes: string[] } | { collections: string[] } | { tags: string[] };

type Kind = 'sources' | 'notes' | 'collections' | 'tags';

type Root = typeof source | typeof note | typeof collection | typeof tag;

/** These rows of `table`, those of them in this Library. */
const mine = (table: Root, accountId: string, ids: string[]) =>
  and(inArray(table.id, ids), eq(table.accountId, accountId));

/**
 * What goes with what, read under the roots' lock before the delete takes
 * it along. The database does the deleting: a Source's Notes and every Tag
 * link cascade with their carrier and their Tag, and a Tag left unused goes
 * too (0013_tags, 0016_collections). Each entry here lists those rows, so
 * Geri al can put them back.
 */
const cascades: Record<
  Kind,
  { table: Root; along: (tx: LibraryTx, accountId: string, ids: string[]) => Promise<Record<string, StoredRow[]>> }
> = {
  // A Source takes its Notes, and both their Tag links.
  sources: {
    table: source,
    along: async (tx, accountId, ids) => {
      const notes = (
        await tx
          .select({ row: storedRow(note) })
          .from(note)
          .where(and(inArray(note.sourceId, ids), eq(note.accountId, accountId)))
      ).map(({ row }) => row);
      const noteIds = notes.map((row) => row.id as string);
      return { note: notes, ...(await tagParts(tx, accountId, { sourceIds: ids, noteIds })) };
    },
  },
  notes: { table: note, along: (tx, accountId, ids) => tagParts(tx, accountId, { noteIds: ids }) },
  // Notes and Tags stay; only the Collection's Tag references go.
  collections: { table: collection, along: (tx, accountId, ids) => tagParts(tx, accountId, { collectionIds: ids }) },
  // A Tag comes off every Note, Source and Collection.
  tags: { table: tag, along: (tx, accountId, ids) => tagParts(tx, accountId, { tagIds: ids }) },
};

type Carriers = { noteIds?: string[]; sourceIds?: string[]; collectionIds?: string[]; tagIds?: string[] };

/**
 * The Tag parts for Notes, Sources or Collections about to be deleted, or
 * Tags (Tag sil): their links, and every other Tag those point at, since a
 * Tag left unused goes with its last link. The Tags being deleted are the
 * roots, read as such.
 */
async function tagParts(
  tx: LibraryTx,
  accountId: string,
  { noteIds = [], sourceIds = [], collectionIds = [], tagIds = [] }: Carriers,
): Promise<{ tag: StoredRow[]; note_tag: StoredRow[]; source_tag: StoredRow[]; collection_tag: StoredRow[] }> {
  const carrierIds = new Map<LinkTable, string[]>([
    [noteTag, noteIds],
    [sourceTag, sourceIds],
    [collectionTag, collectionIds],
  ]);
  const links = new Map<LinkTable, { row: StoredRow; tagId: string }[]>();
  for (const { table, carrier } of linkTables) {
    const ids = carrierIds.get(table)!;
    links.set(
      table,
      ids.length || tagIds.length
        ? await tx
            .select({ row: storedRow(table), tagId: table.tagId })
            .from(table)
            .where(
              and(
                or(
                  ids.length ? inArray(carrier, ids) : undefined,
                  tagIds.length ? inArray(table.tagId, tagIds) : undefined,
                ),
                eq(table.accountId, accountId),
              ),
            )
        : [],
    );
  }
  const linked = [...links.values()].flat();
  const otherTagIds = [...new Set(linked.map((l) => l.tagId))].filter((id) => !tagIds.includes(id));
  const tags = otherTagIds.length
    ? await tx
        .select({ row: storedRow(tag) })
        .from(tag)
        .where(and(inArray(tag.id, otherTagIds), eq(tag.accountId, accountId)))
    : [];
  const rowsOf = (table: LinkTable) => links.get(table)!.map(({ row }) => row);
  return {
    tag: tags.map(({ row }) => row),
    note_tag: rowsOf(noteTag),
    source_tag: rowsOf(sourceTag),
    collection_tag: rowsOf(collectionTag),
  };
}

/**
 * Deletes the target's rows still there, with everything that goes with
 * them, and keeps one Geri al record that brings it all back with the same
 * ids. `extra` joins that record: what the same operation added (`remove`)
 * or changed (`revert`), as Note merge does. Nothing to delete (gone
 * already, or never this Library's) records nothing and gives no token.
 */
export async function deleteWithUndo(
  tx: LibraryTx,
  accountId: string,
  now: Date,
  target: DeleteTarget,
  extra: Pick<UndoSnapshot, 'remove' | 'revert'> = {},
): Promise<{ count: number; undoToken: string | null }> {
  const [kind, ids] = Object.entries(target)[0] as [Kind, string[]];
  const { table, along } = cascades[kind];
  const roots = ids.length
    ? await tx
        .select({ row: storedRow(table) })
        .from(table)
        .where(mine(table, accountId, ids))
        .for('update')
    : [];
  if (!roots.length) return { count: 0, undoToken: null };
  const found = roots.map(({ row }) => row.id as string);
  const reinsert = { ...(await along(tx, accountId, found)), [getTableName(table)]: roots.map(({ row }) => row) };
  await tx.delete(table).where(mine(table, accountId, found));
  const undoToken = await recordUndo(tx, accountId, now, { ...extra, reinsert });
  return { count: found.length, undoToken };
}
