import { z } from 'zod';

import { createDb, type Db } from './db/client';
import { invitations } from './invitations/invitations';

/**
 * The Operator's command for granting, withdrawing and listing Invitations; there is no admin
 * screen and no invitation email. Returns what to print.
 */
export async function runInviteCommand(db: Db, [command, email]: string[]): Promise<string> {
  const invited = invitations(db);
  if (command === 'add' && email) {
    if (!z.email().safeParse(email.trim()).success) throw new Error(`${email} is not an email address.`);
    return (await invited.add(email)) ? `Invited ${email}.` : `${email} was already invited.`;
  }
  if (command === 'remove' && email) {
    const { wasInvited, accountStaysOpen } = await invited.remove(email);
    const removed = wasInvited ? `Removed ${email}.` : `${email} was not on the list.`;
    return accountStaysOpen ? `${removed} Its Account stays open.` : removed;
  }
  if (command === 'list') {
    const rows = await invited.list();
    if (rows.length === 0) return 'No one is invited yet.';
    return rows.map((r) => `${r.email}  invited ${r.createdAt.toISOString().slice(0, 10)}`).join('\n');
  }
  throw new Error(USAGE);
}

const USAGE = 'Usage: pnpm --filter @homelibra/api invite add <email> | remove <email> | list';

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);
  try {
    console.info(await runInviteCommand(db, process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
}
