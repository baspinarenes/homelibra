import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export function createDb(url: string) {
  const client = postgres(url);
  return Object.assign(drizzle(client, { schema }), { close: () => client.end() });
}

export type Db = ReturnType<typeof createDb>;
export type LibraryTx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * Runs `fn` in a transaction scoped to one Library: `app.user_id` is set for
 * the transaction only, and row-level security hides every other Library's
 * rows. Queries inside must still filter by account id themselves; this is
 * the second layer, so a forgotten `where` returns nothing rather than
 * another scholar's notes (ADR-0006).
 */
export function withLibrary<T>(db: Db, accountId: string, fn: (tx: LibraryTx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${accountId}, true)`);
    return fn(tx);
  });
}
