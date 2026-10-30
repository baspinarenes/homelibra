import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';
import { runUsageCommand } from './usage';

const t = testApi();

/** The command's line for this address, or undefined when it has none. */
const lineOf = async (email: string) =>
  (await runUsageCommand(t.db, [])).split('\n').find((line) => line.split(/\s+/)[0] === email);

describe("the Operator's usage command (#40, Operator)", () => {
  it('lists each Account with its Notes, Collections and Markdown copies, counted on the server', async () => {
    const email = scholarEmail();
    const api = await (await t.signIn(email)).call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Tezâkir' });
    await api.notes.create({ id: uuidv7(), sourceId, excerpt: 'Kadı azledildi.', tags: ['kadı'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Tarihi tutmuyor.' });
    await api.collections.create({ name: 'Kadılık', tags: ['kadı'] });
    await api.collections.create({ name: 'Taslak', tags: [] });

    await api.collections.copied();
    await api.collections.copied();
    await api.collections.copied();

    expect(await lineOf(email)).toBe(`${email}  notes 2  collections 2  copies 3`);
  });

  it('lists an Account that has done nothing yet with zeros', async () => {
    const email = scholarEmail();
    await t.signIn(email);

    expect(await lineOf(email)).toBe(`${email}  notes 0  collections 0  copies 0`);
  });

  it('counts each Library on its own', async () => {
    const mine = scholarEmail();
    const theirs = scholarEmail();
    const api = await (await t.signIn(mine)).call();
    await t.signIn(theirs);
    await api.collections.create({ name: 'Taslak', tags: [] });

    await api.collections.copied();

    expect(await lineOf(mine)).toBe(`${mine}  notes 0  collections 1  copies 1`);
    expect(await lineOf(theirs)).toBe(`${theirs}  notes 0  collections 0  copies 0`);
  });
});
