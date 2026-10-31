import { sql } from 'drizzle-orm';

import { createDb, type Db } from './db/client';

/**
 * The Operator's usage command (#40, "Operator ve işletim"): each Account's
 * Notes, Collections and Markdown copies, from server-side counts alone,
 * no analytics SDK. Counts only, never Library content. Returns what to print.
 */
export async function runUsageCommand(db: Db, args: string[]): Promise<string> {
  if (args.length > 0) throw new Error(USAGE);
  const rows = await db.execute<{ email: string; notes: number; collections: number; markdown_copies: number }>(
    sql`select email, notes, collections, markdown_copies from hl_usage_counts()`,
  );
  if (rows.length === 0) return 'No Accounts yet.';
  return rows
    .map((r) => `${r.email}  notes ${r.notes}  collections ${r.collections}  copies ${r.markdown_copies}`)
    .join('\n');
}

const USAGE = 'Usage: pnpm --filter @homelibra/api usage';

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);
  try {
    console.info(await runUsageCommand(db, process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}
