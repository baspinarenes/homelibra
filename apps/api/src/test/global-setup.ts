import postgres from 'postgres';

import { runMigrations } from '../db/migrate';
import { testMigrationDatabaseUrl } from './db';

/** Every run starts from an empty database and applies all migrations. */
export default async function setup() {
  const sql = postgres(testMigrationDatabaseUrl, { onnotice: () => {} });
  try {
    await sql`drop schema if exists drizzle cascade`;
    await sql`drop schema if exists public cascade`;
    await sql`create schema public`;
  } finally {
    await sql.end();
  }
  await runMigrations(testMigrationDatabaseUrl);
}
