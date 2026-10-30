import { sql } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { note, noteTag, source } from '../db/schema';

/**
 * Whether the Note `n` of the Source `s` (SQL aliases) is one Organizing
 * pass waits on: it has no Tag of its own (the Source's do not count,
 * ADR-0003) and came into the Source, captured or moved, after the
 * Source's last "Bitir"; before the first one, every untagged Note. Taking
 * a Tag off an older Note later does not bring it back.
 */
export const waiting = (accountId: string, n: string, s: string) => {
  const [nr, sr] = [sql.raw(n), sql.raw(s)];
  return sql`not exists (select 1 from ${noteTag} nt where nt.note_id = ${nr}.id and nt.account_id = ${accountId})
    and (${sr}.last_finished_at is null or ${nr}.entered_source_at > ${sr}.last_finished_at)`;
};

/** How many of the Source's Notes Organizing pass waits on, as Düzenlenecekler counts them. */
export async function waitingCount(tx: LibraryTx, accountId: string, sourceId: string) {
  const [row] = await tx.execute<{ count: number }>(
    sql`select count(*)::int as count from ${note} n
          join ${source} s on s.id = n.source_id and s.account_id = n.account_id
         where n.source_id = ${sourceId} and n.account_id = ${accountId} and ${waiting(accountId, 'n', 's')}`,
  );
  return row?.count ?? 0;
}
