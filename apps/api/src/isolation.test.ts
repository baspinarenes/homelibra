import { describe, expect, it } from 'vitest';

import { withLibrary } from './db/client';
import { source } from './db/schema';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

type Device = Awaited<ReturnType<typeof t.signIn>>;

async function addSource(device: Device, title: string) {
  await (await device.call()).sources.create({ type: 'book', title });
}

describe('Library isolation', () => {
  it("one Account never sees another Account's Library", async () => {
    const kadi = await t.signIn(scholarEmail('kadi'));
    const naib = await t.signIn(scholarEmail('naib'));
    await addSource(kadi, 'Taşrada Kadı ve Naib');

    expect(await (await kadi.call()).sources.home()).toEqual({ sourceCount: 1 });
    expect(await (await naib.call()).sources.home()).toEqual({ sourceCount: 0 });
  });

  it('a query that forgets the account filter still returns only its own Library', async () => {
    const kadi = await t.signIn(scholarEmail('kadi'));
    const naib = await t.signIn(scholarEmail('naib'));
    await addSource(kadi, 'Taşrada Kadı ve Naib');

    // No `where`: only row-level security stands between the two Libraries.
    const unscoped = (accountId: string) => withLibrary(t.db, accountId, (tx) => tx.select().from(source));

    expect(await unscoped(naib.accountId)).toEqual([]);
    expect((await unscoped(kadi.accountId)).map((s) => s.title)).toEqual(['Taşrada Kadı ve Naib']);
  });

  it("outside a Library transaction the API's role sees no Library rows", async () => {
    const kadi = await t.signIn(scholarEmail('kadi'));
    await addSource(kadi, 'Taşrada Kadı ve Naib');

    expect(await t.db.select().from(source)).toEqual([]);
  });

  it("another Account's Source cannot be read, changed or listed", async () => {
    const kadi = await (await t.signIn(scholarEmail('kadi'))).call();
    const naib = await (await t.signIn(scholarEmail('naib'))).call();
    const { id } = await kadi.sources.create({ type: 'archive', title: 'DH.MKT', author: 'BOA' });

    await expect(naib.sources.get({ id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(naib.sources.update({ id, title: 'A.MKT.MHM' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await naib.sources.list({ sort: 'title' })).toEqual([]);

    expect(await kadi.sources.get({ id })).toMatchObject({ title: 'DH.MKT' });
  });
});
