import { and, eq, inArray, or, sql } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { collectionTag, noteTag, sourceTag, tag } from '../db/schema';
import { storedRow, type StoredRow } from '../undo/stored-row';
import { carrierOf, type LinkTable, linkTables } from './tags';

type Carriers = { noteIds?: string[]; sourceIds?: string[]; collectionIds?: string[]; tagIds?: string[] };

/**
 * The Tag parts of an undo snapshot, by table name, for Notes, Sources or
 * Collections about to be deleted, or Tags (Tag sil): their links, and every
 * Tag those point at. Read before the delete, since the links cascade with
 * their carriers and their Tag, and a Tag left unused goes too (0013_tags).
 */
export async function tagParts(
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
  const allTagIds = [...new Set([...tagIds, ...linked.map((l) => l.tagId)])];
  const tags = allTagIds.length
    ? await tx
        .select({ row: storedRow(tag) })
        .from(tag)
        .where(and(inArray(tag.id, allTagIds), eq(tag.accountId, accountId)))
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
 * Geri al for Tags: the ones still there (another carrier kept them) stay as
 * they are, the ones that went come back with their own ids.
 */
export async function reinsertTags(tx: LibraryTx, rows: StoredRow[]) {
  await tx.execute(sql`
    insert into ${tag} (id, account_id, name, identity, created_at)
    select id, account_id, name, identity, created_at from jsonb_populate_recordset(null::${tag}, ${JSON.stringify(rows)}::jsonb)
    on conflict do nothing`);
}

/**
 * Geri al for a link table (note_tag, source_tag or collection_tag), after
 * the Tags: each link goes to the Library's Tag of its Tag's identity. That
 * is the same Tag, unless the scholar named it again meanwhile, after it had
 * gone: then the new one, under its new spelling.
 */
export async function reinsertTagLinks(
  tx: LibraryTx,
  table: LinkTable,
  accountId: string,
  rows: StoredRow[],
  tags: StoredRow[],
) {
  const carrier = sql.raw(carrierOf(table).name);
  await tx.execute(sql`
    insert into ${table} (${carrier}, tag_id, account_id, created_at)
    select r.${carrier}, t.id, r.account_id, r.created_at
      from jsonb_populate_recordset(null::${table}, ${JSON.stringify(rows)}::jsonb) r
      join jsonb_populate_recordset(null::${tag}, ${JSON.stringify(tags)}::jsonb) old on old.id = r.tag_id
      join ${tag} t on t.account_id = ${accountId} and t.identity = old.identity
    on conflict do nothing`);
}
