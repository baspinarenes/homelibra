import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { withLibrary } from './db/client';
import { source } from './db/schema';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

/** No procedure creates Sources yet (#43), so the fixture goes in as the table owner. */
async function addSource(accountId: string, title: string) {
  await t.owner.insert(source).values({ id: uuidv7(), accountId, title });
}

describe('Library isolation', () => {
  it("one Account never sees another Account's Library", async () => {
    const kadi = await t.signIn(scholarEmail('kadi'));
    const naib = await t.signIn(scholarEmail('naib'));
    await addSource(kadi.accountId, 'Taşrada Kadı ve Naib');

    expect(await (await kadi.call()).sources.home()).toEqual({ sourceCount: 1 });
    expect(await (await naib.call()).sources.home()).toEqual({ sourceCount: 0 });
  });

  it('a query that forgets the account filter still returns only its own Library', async () => {
    const kadi = await t.signIn(scholarEmail('kadi'));
    const naib = await t.signIn(scholarEmail('naib'));
    await addSource(kadi.accountId, 'Taşrada Kadı ve Naib');

    // No `where`: only row-level security stands between the two Libraries.
    const unscoped = (accountId: string) => withLibrary(t.db, accountId, (tx) => tx.select().from(source));

    expect(await unscoped(naib.accountId)).toEqual([]);
    expect((await unscoped(kadi.accountId)).map((s) => s.title)).toEqual(['Taşrada Kadı ve Naib']);
  });

  it("outside a Library transaction the API's role sees no Library rows", async () => {
    const kadi = await t.signIn(scholarEmail('kadi'));
    await addSource(kadi.accountId, 'Taşrada Kadı ve Naib');

    expect(await t.db.select().from(source)).toEqual([]);
  });
});
