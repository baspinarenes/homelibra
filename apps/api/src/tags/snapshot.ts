import { and, eq, inArray, or, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import type { LibraryTx } from '../db/client';
import { collectionTag, noteTag, sourceTag, tag } from '../db/schema';

/** Rows as `to_jsonb` gives them, the form of an undo snapshot's parts (src/undo/undo.ts). */
type Rows = Record<string, unknown>[];

/**
 * The Tag parts of an undo snapshot, by table name, for Notes and Sources
 * about to be deleted, or Tags (Tag sil): their links, and every Tag those
 * point at. A deleted Tag's Collection references are read too. Read before
 * the delete, since the links cascade with their carriers and their Tag,
 * and a Tag left unused goes too (0013_tags).
 */
export async function tagParts(
  tx: LibraryTx,
  accountId: string,
  { noteIds = [], sourceIds = [], tagIds = [] }: { noteIds?: string[]; sourceIds?: string[]; tagIds?: string[] },
): Promise<{ tag: Rows; note_tag: Rows; source_tag: Rows; collection_tag: Rows }> {
  const collectionLinks = tagIds.length
    ? await tx
        .select({ row: sql<Record<string, unknown>>`to_jsonb(${collectionTag})` })
        .from(collectionTag)
        .where(and(inArray(collectionTag.tagId, tagIds), eq(collectionTag.accountId, accountId)))
    : [];
  const noteLinks =
    noteIds.length || tagIds.length
      ? await tx
          .select({ row: sql<Record<string, unknown>>`to_jsonb(${noteTag})`, tagId: noteTag.tagId })
          .from(noteTag)
          .where(
            and(
              or(
                noteIds.length ? inArray(noteTag.noteId, noteIds) : undefined,
                tagIds.length ? inArray(noteTag.tagId, tagIds) : undefined,
              ),
              eq(noteTag.accountId, accountId),
            ),
          )
      : [];
  const sourceLinks =
    sourceIds.length || tagIds.length
      ? await tx
          .select({ row: sql<Record<string, unknown>>`to_jsonb(${sourceTag})`, tagId: sourceTag.tagId })
          .from(sourceTag)
          .where(
            and(
              or(
                sourceIds.length ? inArray(sourceTag.sourceId, sourceIds) : undefined,
                tagIds.length ? inArray(sourceTag.tagId, tagIds) : undefined,
              ),
              eq(sourceTag.accountId, accountId),
            ),
          )
      : [];
  const allTagIds = [...new Set([...tagIds, ...noteLinks.map((l) => l.tagId), ...sourceLinks.map((l) => l.tagId)])];
  const tags = allTagIds.length
    ? await tx
        .select({ row: sql<Record<string, unknown>>`to_jsonb(${tag})` })
        .from(tag)
        .where(and(inArray(tag.id, allTagIds), eq(tag.accountId, accountId)))
    : [];
  return {
    tag: tags.map(({ row }) => row),
    note_tag: noteLinks.map(({ row }) => row),
    source_tag: sourceLinks.map(({ row }) => row),
    collection_tag: collectionLinks.map(({ row }) => row),
  };
}

/**
 * Geri al for Tags: the ones still there (another carrier kept them) stay as
 * they are, the ones that went come back with their own ids.
 */
export async function reinsertTags(tx: LibraryTx, rows: Rows) {
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
export async function reinsertTagLinks(tx: LibraryTx, table: PgTable, accountId: string, rows: Rows, tags: Rows) {
  const carrier = sql.raw(table === noteTag ? 'note_id' : table === sourceTag ? 'source_id' : 'collection_id');
  await tx.execute(sql`
    insert into ${table} (${carrier}, tag_id, account_id, created_at)
    select r.${carrier}, t.id, r.account_id, r.created_at
      from jsonb_populate_recordset(null::${table}, ${JSON.stringify(rows)}::jsonb) r
      join jsonb_populate_recordset(null::${tag}, ${JSON.stringify(tags)}::jsonb) old on old.id = r.tag_id
      join ${tag} t on t.account_id = ${accountId} and t.identity = old.identity
    on conflict do nothing`);
}
