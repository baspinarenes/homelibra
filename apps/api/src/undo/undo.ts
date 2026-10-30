import { and, eq, getTableColumns, getTableName, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

import type { Db, LibraryTx } from '../db/client';
import { collection, collectionTag, note, noteTag, source, sourceTag, tag, undoRecord } from '../db/schema';
import { reinsertTagLinks, reinsertTags } from '../tags/snapshot';
import { quoted, type StoredRow } from './stored-row';

export { storedRow, type StoredRow } from './stored-row';

/**
 * How long the server keeps an operation's Geri al: well past the app's
 * five-second bar, so a slow connection still gets there (#40). The
 * clean-up job deletes the record after that.
 */
export const UNDO_LIFETIME_MS = 5 * 60 * 1000;

/**
 * The Library tables Geri al writes rows back into, parents before
 * children: undo puts a Source back before its Notes, Tags before their
 * links. A table joins with one entry here. Most rows go back as they were;
 * Tags have their own way (tags/snapshot.ts), since one may still be there
 * or have been named again meanwhile.
 */
type Restorable = {
  table: PgTable;
  reinsert?: (tx: LibraryTx, accountId: string, rows: StoredRow[], parts: Record<string, StoredRow[]>) => Promise<void>;
};
const restorable: Restorable[] = [
  { table: source },
  { table: note },
  { table: tag, reinsert: (tx, _, rows) => reinsertTags(tx, rows) },
  {
    table: noteTag,
    reinsert: (tx, accountId, rows, parts) => reinsertTagLinks(tx, noteTag, accountId, rows, parts.tag ?? []),
  },
  {
    table: sourceTag,
    reinsert: (tx, accountId, rows, parts) => reinsertTagLinks(tx, sourceTag, accountId, rows, parts.tag ?? []),
  },
  { table: collection },
  {
    table: collectionTag,
    reinsert: (tx, accountId, rows, parts) => reinsertTagLinks(tx, collectionTag, accountId, rows, parts.tag ?? []),
  },
];

/**
 * What one operation needs to be taken back, by SQL table name. Versionless
 * and every part optional, so a later operation adds what it needs:
 *
 * - `reinsert`: rows the operation deleted, whole, put back with their own
 *   ids. Rows a delete takes with it by cascade (a Source's Notes, their
 *   Tag links and every Tag they point at: tags/snapshot.ts) must be read before the
 *   delete and listed here too.
 * - `revert`: rows the operation changed, as their `id` and the columns'
 *   earlier values (a move: the Note's Source and when it entered it).
 * - `remove`: rows the operation added, as the columns that identify them
 *   (bulk tagging: only the links it put on, `note_id` and `tag_id`, never
 *   the ones the Notes had already). A Tag left unused by that goes too.
 *
 * Undo takes `remove` away first, then puts `reinsert` back, then applies `revert`.
 */
export type UndoSnapshot = {
  reinsert?: Record<string, StoredRow[]>;
  revert?: Record<string, StoredRow[]>;
  remove?: Record<string, StoredRow[]>;
};

/** A table's columns that a row can be written with: all but the generated ones (search). */
function writableColumns(table: PgTable) {
  return Object.values(getTableColumns(table))
    .filter((column) => !column.generated)
    .map((column) => column.name);
}

/** Keeps the snapshot and returns its token, which the operation hands to the app. */
export async function recordUndo(tx: LibraryTx, accountId: string, now: Date, snapshot: UndoSnapshot) {
  const id = uuidv7();
  await tx
    .insert(undoRecord)
    .values({ id, accountId, snapshot, expiresAt: new Date(now.getTime() + UNDO_LIFETIME_MS) });
  return id;
}

async function reinsert(tx: LibraryTx, table: PgTable, rows: StoredRow[]) {
  const columns = sql.raw(writableColumns(table).map(quoted).join(', '));
  await tx.execute(sql`
    insert into ${table} (${columns})
    select ${columns} from jsonb_populate_recordset(null::${table}, ${JSON.stringify(rows)}::jsonb)`);
}

async function revert(tx: LibraryTx, table: PgTable, accountId: string, rows: StoredRow[]) {
  const writable = new Set(writableColumns(table));
  // Rows of one operation change the same columns.
  const columns = Object.keys(rows[0] ?? {}).filter((name) => name !== 'id');
  if (!columns.length) return;
  if (columns.some((name) => !writable.has(name))) throw new Error(`cannot revert ${getTableName(table)}: ${columns}`);
  const set = sql.raw(columns.map((name) => `${quoted(name)} = r.${quoted(name)}`).join(', '));
  await tx.execute(sql`
    update ${table} set ${set}
      from jsonb_populate_recordset(null::${table}, ${JSON.stringify(rows)}::jsonb) r
     where ${table}."id" = r."id" and ${table}."account_id" = ${accountId}`);
}

async function remove(tx: LibraryTx, table: PgTable, accountId: string, rows: StoredRow[]) {
  const writable = new Set(writableColumns(table));
  // Rows of one operation are identified by the same columns.
  const columns = Object.keys(rows[0] ?? {});
  if (!columns.length) return;
  if (columns.some((name) => !writable.has(name))) throw new Error(`cannot remove ${getTableName(table)}: ${columns}`);
  const match = sql.raw(columns.map((name) => `t.${quoted(name)} = r.${quoted(name)}`).join(' and '));
  await tx.execute(sql`
    delete from ${table} t
     using jsonb_populate_recordset(null::${table}, ${JSON.stringify(rows)}::jsonb) r
     where ${match} and t."account_id" = ${accountId}`);
}

/**
 * Geri al: puts back what the token's operation took, and takes away what
 * it added. Asked again for a token already applied, it changes nothing. A
 * token that never was this Library's or outlived {@link UNDO_LIFETIME_MS} is `expired`. A database
 * refusal (the Source a Note goes back to is gone too) is thrown: the
 * caller's transaction rolls back and the record stays untouched.
 */
export async function applyUndo(
  tx: LibraryTx,
  accountId: string,
  token: string,
  now: Date,
): Promise<'applied' | 'expired'> {
  const [record] = await tx
    .select()
    .from(undoRecord)
    .where(and(eq(undoRecord.id, token), eq(undoRecord.accountId, accountId)))
    .for('update');
  if (!record) return 'expired';
  if (record.undoneAt) return 'applied';
  if (record.expiresAt <= now) return 'expired';
  const snapshot = record.snapshot as UndoSnapshot;
  // Children before parents: a link goes before what it points at.
  for (const { table } of [...restorable].reverse()) {
    const rows = snapshot.remove?.[getTableName(table)];
    if (rows?.length) await remove(tx, table, accountId, rows);
  }
  for (const { table, reinsert: own } of restorable) {
    const rows = snapshot.reinsert?.[getTableName(table)];
    if (!rows?.length) continue;
    if (own) await own(tx, accountId, rows, snapshot.reinsert ?? {});
    else await reinsert(tx, table, rows);
  }
  for (const { table } of restorable) {
    const rows = snapshot.revert?.[getTableName(table)];
    if (rows?.length) await revert(tx, table, accountId, rows);
  }
  await tx.update(undoRecord).set({ undoneAt: now }).where(eq(undoRecord.id, token));
  return 'applied';
}

/**
 * The scheduled clean-up: every Library's records past their time go, applied
 * or not. Returns how many. Runs outside any Library, through the one
 * database function allowed to see them all (0012_undo_record).
 */
export async function deleteExpiredUndoRecords(db: Db, now: Date) {
  const [row] = await db.execute<{ n: number }>(
    sql`select hl_delete_expired_undo_records(${now.toISOString()}::timestamptz) as n`,
  );
  return row?.n ?? 0;
}
