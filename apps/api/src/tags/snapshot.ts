import { sql } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { tag } from '../db/schema';
import type { StoredRow } from '../undo/stored-row';
import { carrierOf, type LinkTable } from './tags';

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
