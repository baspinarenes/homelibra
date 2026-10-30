import { getTableColumns, getTableName, sql, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

/**
 * A row as the database's `to_jsonb` gives it: SQL column names, JSON
 * values. Kept this way so a column added later (Reading status, the last
 * "Bitir", Cover keys) is in the snapshot and comes back without any change
 * here or a migration of old records.
 */
export type StoredRow = Record<string, unknown>;

/** A SQL identifier, quoted. */
export const quoted = (name: string) => `"${name.replaceAll('"', '""')}"`;

/**
 * The column to select (or return from a delete) to snapshot `table`'s
 * rows: the whole row, or only its id and `columns` when an operation
 * changes just those.
 */
export function storedRow(table: PgTable, columns?: PgColumn[]): SQL<StoredRow> {
  if (columns) {
    const pairs = columns.map((column) => sql`${column.name}::text, ${column}`);
    return sql<StoredRow>`jsonb_build_object('id', ${sql.raw(`${quoted(getTableName(table))}."id"`)}, ${sql.join(pairs, sql`, `)})`;
  }
  const generated = Object.values(getTableColumns(table))
    .filter((column) => column.generated)
    .map((column) => `'${column.name}'`);
  const whole = sql`to_jsonb(${table})`;
  return (generated.length ? sql`${whole} - array[${sql.raw(generated.join(', '))}]::text[]` : whole) as SQL<StoredRow>;
}
