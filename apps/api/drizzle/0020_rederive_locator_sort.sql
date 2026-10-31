-- Hand-written: sort values corrected by hand go (#125), each Note's read from
-- its Locator again. That rule lives in core (editedNote), not in SQL, so this
-- only queues the work: runMigrations (src/db/migrate.ts) does it right after
-- the SQL migrations, and drops the row in the same transaction, so it runs
-- once. The table sits with Drizzle's own bookkeeping, out of the API's reach.
CREATE TABLE IF NOT EXISTS drizzle.pending_data_migration (name text PRIMARY KEY);--> statement-breakpoint
INSERT INTO drizzle.pending_data_migration VALUES ('rederive-locator-sort') ON CONFLICT DO NOTHING;
