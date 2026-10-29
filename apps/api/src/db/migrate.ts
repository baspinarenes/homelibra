import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDb } from './client';

export const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

/** Applies migrations as the table owner, never as the API's role. */
export async function runMigrations(ownerUrl: string) {
  const db = createDb(ownerUrl);
  try {
    await migrate(db, { migrationsFolder });
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
