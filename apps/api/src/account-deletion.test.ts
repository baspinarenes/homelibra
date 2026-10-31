import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

const DAY_MS = 24 * 60 * 60 * 1000;

const accountClosed = expect.objectContaining<Partial<TRPCError>>({ code: 'FORBIDDEN', message: 'ACCOUNT_CLOSED' });

/** A Library with one Source and one Note in it, signed in on one device. */
async function scholarWithLibrary() {
  const email = scholarEmail();
  const device = await t.signIn(email);
  const api = await device.call();
  const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
  await api.notes.create({
    id: uuidv7(),
    sourceId,
    locator: 's. 45',
    excerpt: 'Kadı, naibini kendisi seçerdi.',
    tags: ['kadı'],
  });
  await api.tags.setOnSource({ sourceId, names: ['kadı', 'Çorum'] });
  return { email, device, sourceId };
}

/**
 * Rows anywhere in the database that still belong to the Account or carry
 * its address, read as the table owner past row-level security. Every table
 * with an account_id counts, so a Library table added later is covered too.
 */
async function rowsLeft(accountId: string, email: string) {
  const tables = await t.owner.execute<{ table_name: string }>(
    sql`select table_name from information_schema.columns where table_schema = 'public' and column_name = 'account_id'`,
  );
  const left: Record<string, number> = {};
  const count = async (name: string, where: ReturnType<typeof sql>) => {
    const [row] = await t.owner.execute<{ n: number }>(
      sql`select count(*)::int as n from ${sql.identifier(name)} where ${where}`,
    );
    if (row?.n) left[name] = row.n;
  };
  for (const { table_name } of tables) await count(table_name, sql`account_id = ${accountId}`);
  await count('account', sql`id = ${accountId} or email = ${email}`);
  await count('invitation', sql`email = ${email}`);
  await count('verification', sql`strpos(identifier, ${accountId}) > 0 or strpos(identifier, ${email}) > 0`);
  return left;
}

/** Asks for the deletion code and confirms it, as Hesabı sil does. */
async function deleteAccount(device: Awaited<ReturnType<typeof t.signIn>>, email: string) {
  await (await device.call()).account.requestDeletion();
  await (await device.call()).account.confirmDeletion({ code: t.mail.lastCodeFor(email) });
}

describe('closing an Account', () => {
  it('closes the Account at once when the code from the email is confirmed', async () => {
    const email = scholarEmail();
    const device = await t.signIn(email);
    const other = await t.signIn(email);

    await deleteAccount(device, email);

    // Every device is signed out; signing in again finds the Library closed.
    await expect(device.account()).rejects.toThrow('the session has ended');
    await expect(other.account()).rejects.toThrow('the session has ended');
    const back = await t.signIn(email, { invite: false });
    expect(await back.account()).toMatchObject({ deletionRequestedAt: expect.any(Date) });
    await expect((await back.call()).sources.home()).rejects.toThrowError(accountClosed);
  });

  it('keeps the Account open when the code is wrong, and lets no code be guessed', async () => {
    const email = scholarEmail();
    const device = await t.signIn(email);
    await (await device.call()).account.requestDeletion();
    const right = t.mail.lastCodeFor(email);
    const wrong = right === '000000' ? '111111' : '000000';

    for (let attempt = 0; attempt < 3; attempt++) {
      await expect((await device.call()).account.confirmDeletion({ code: wrong })).rejects.toThrowError(
        expect.objectContaining<Partial<TRPCError>>({ code: 'BAD_REQUEST', message: 'INVALID_CODE' }),
      );
    }
    // Three wrong tries use the code up: even the right one no longer works.
    await expect((await device.call()).account.confirmDeletion({ code: right })).rejects.toThrow('INVALID_CODE');

    expect(await device.account()).toMatchObject({ deletionRequestedAt: null });
    expect(await (await device.call()).sources.home()).toEqual({ sourceCount: 0 });
  });
});

describe('cancelling the deletion', () => {
  it('reopens the Library as it was for a scholar who signs in within 14 days', async () => {
    const { email, device, sourceId } = await scholarWithLibrary();
    const before = await (await device.call()).notes.list({ sourceId });
    await deleteAccount(device, email);

    const back = await t.signIn(email, { invite: false });
    await (await back.call()).account.cancelDeletion();

    expect(await back.account()).toMatchObject({ deletionRequestedAt: null });
    const api = await back.call();
    expect(await api.sources.home()).toEqual({ sourceCount: 1 });
    expect(await api.notes.list({ sourceId })).toEqual(before);
  });
});

describe('the 14th day', () => {
  it('deletes the Account, its whole Library and its Invitation for good once 14 days have passed', async () => {
    const { email, device } = await scholarWithLibrary();
    await deleteAccount(device, email);
    const back = await t.signIn(email, { invite: false });
    const { deletionRequestedAt } = await back.account();
    if (!deletionRequestedAt) throw new Error('the Account did not close');
    const closedAt = deletionRequestedAt.getTime();

    await t.api.jobs.deleteClosedAccounts(new Date(closedAt + 14 * DAY_MS - 1000));
    expect(await back.account()).toMatchObject({ email });

    await t.api.jobs.deleteClosedAccounts(new Date(closedAt + 14 * DAY_MS));
    expect(await rowsLeft(device.accountId, email)).toEqual({});
    // The address is a stranger again: closed beta turns it away.
    expect((await t.requestCode(email)).status).toBe(403);
  });

  it('leaves a code waiting for an address that only contains the deleted one', async () => {
    const { email, device } = await scholarWithLibrary();
    const neighbour = `x${email}`;
    await t.invite(neighbour);
    await deleteAccount(device, email);
    expect((await t.requestCode(neighbour)).ok).toBe(true);

    await t.api.jobs.deleteClosedAccounts(new Date(Date.now() + 15 * DAY_MS));

    const signedIn = await t.api.auth.api.signInEmailOTP({
      body: { email: neighbour, otp: t.mail.lastCodeFor(neighbour) },
      asResponse: true,
    });
    expect(signedIn.ok).toBe(true);
  });

  it('leaves a cancelled deletion and every open Account alone', async () => {
    const cancelled = await scholarWithLibrary();
    await deleteAccount(cancelled.device, cancelled.email);
    await (await (await t.signIn(cancelled.email, { invite: false })).call()).account.cancelDeletion();
    const open = await scholarWithLibrary();

    await t.api.jobs.deleteClosedAccounts(new Date(Date.now() + 30 * DAY_MS));

    for (const { email, sourceId } of [cancelled, open]) {
      const api = await (await t.signIn(email, { invite: false })).call();
      expect(await api.notes.list({ sourceId })).toHaveLength(1);
    }
  });
});
