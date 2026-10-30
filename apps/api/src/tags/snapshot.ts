import { and, eq, inArray, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import type { LibraryTx } from '../db/client';
import { noteTag, sourceTag, tag } from '../db/schema';

/** Rows as `to_jsonb` gives them, the form of an undo snapshot's parts (src/undo/undo.ts). */
type Rows = Record<string, unknown>[];

/**
 * The Tag parts of an undo snapshot, by table name, for Notes and Sources
 * about to be deleted: their links, and every Tag those point at. Read
 * before the delete, since the links cascade with their carriers and a Tag
 * left unused goes too (0013_tags).
 */
export async function tagParts(
  tx: LibraryTx,
  accountId: string,
  { noteIds = [], sourceIds = [] }: { noteIds?: string[]; sourceIds?: string[] },
): Promise<{ tag: Rows; note_tag: Rows; source_tag: Rows }> {
  const noteLinks = noteIds.length
    ? await tx
        .select({ row: sql<Record<string, unknown>>`to_jsonb(${noteTag})`, tagId: noteTag.tagId })
        .from(noteTag)
        .where(and(inArray(noteTag.noteId, noteIds), eq(noteTag.accountId, accountId)))
    : [];
  const sourceLinks = sourceIds.length
    ? await tx
        .select({ row: sql<Record<string, unknown>>`to_jsonb(${sourceTag})`, tagId: sourceTag.tagId })
        .from(sourceTag)
        .where(and(inArray(sourceTag.sourceId, sourceIds), eq(sourceTag.accountId, accountId)))
    : [];
  const tagIds = [...new Set([...noteLinks, ...sourceLinks].map((link) => link.tagId))];
  const tags = tagIds.length
    ? await tx
        .select({ row: sql<Record<string, unknown>>`to_jsonb(${tag})` })
        .from(tag)
        .where(and(inArray(tag.id, tagIds), eq(tag.accountId, accountId)))
    : [];
  return {
    tag: tags.map(({ row }) => row),
    note_tag: noteLinks.map(({ row }) => row),
    source_tag: sourceLinks.map(({ row }) => row),
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
 * Geri al for a link table (note_tag or source_tag), after the Tags: each
 * link goes to the Library's Tag of its Tag's identity. That is the same
 * Tag, unless the scholar named it again meanwhile, after it had gone: then
 * the new one, under its new spelling.
 */
export async function reinsertTagLinks(tx: LibraryTx, table: PgTable, accountId: string, rows: Rows, tags: Rows) {
  const carrier = sql.raw(table === noteTag ? 'note_id' : 'source_id');
  await tx.execute(sql`
    insert into ${table} (${carrier}, tag_id, account_id, created_at)
    select r.${carrier}, t.id, r.account_id, r.created_at
      from jsonb_populate_recordset(null::${table}, ${JSON.stringify(rows)}::jsonb) r
      join jsonb_populate_recordset(null::${tag}, ${JSON.stringify(tags)}::jsonb) old on old.id = r.tag_id
      join ${tag} t on t.account_id = ${accountId} and t.identity = old.identity
    on conflict do nothing`);
}
