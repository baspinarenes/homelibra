import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { rederiveSortValues } from '../notes/sort-values';
import { createDb, type Db, type LibraryTx } from './client';

export const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

/**
 * Data migrations whose rule lives in TypeScript (core), not SQL. A SQL
 * migration queues one by name in drizzle.pending_data_migration; it runs
 * after the SQL migrations, once.
 */
const dataMigrations: Record<string, (tx: LibraryTx) => Promise<void>> = {
  'rederive-locator-sort': rederiveSortValues,
};

/** Runs the queued data migrations; each leaves the queue in the transaction that does it. */
async function runDataMigrations(db: Db) {
  await db.transaction(async (tx) => {
    const queued = await tx.execute<{ name: string }>(sql`delete from drizzle.pending_data_migration returning name`);
    for (const { name } of queued) {
      const run = dataMigrations[name];
      if (!run) throw new Error(`No data migration named ${name}`);
      await run(tx);
    }
  });
}

/** Applies migrations as the table owner, never as the API's role. */
export async function runMigrations(ownerUrl: string) {
  const db = createDb(ownerUrl);
  try {
    await migrate(db, { migrationsFolder });
    await runDataMigrations(db);
  } finally {
    await db.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error('MIGRATION_DATABASE_URL is required');
  await runMigrations(url);
  console.info('migrations applied');
}
