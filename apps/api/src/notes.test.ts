import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { withLibrary } from './db/client';
import { note } from './db/schema';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholarWithSource() {
  const api = await (await t.signIn(scholarEmail())).call();
  const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
  return { api, sourceId };
}

describe('Note', () => {
  it("is created in its Source's flow, oldest first", async () => {
    const { api, sourceId } = await scholarWithSource();
    const first = uuidv7();
    const second = uuidv7();

    await api.notes.create({ id: first, sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.' });
    await api.notes.create({ id: second, sourceId, locator: 's. 45', comment: 'Naiplik bir tür kiralama mı?' });

    expect(await api.notes.flow({ sourceId })).toEqual([
      { id: first, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.', comment: null },
      { id: second, locator: 's. 45', excerpt: null, comment: 'Naiplik bir tür kiralama mı?' },
    ]);
  });
});

describe('Note creation', () => {
  it('is idempotent: a second call with the same id makes no second Note', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();

    await api.notes.create({ id, sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.' });
    await api.notes.create({ id, sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.' });

    expect(await api.notes.flow({ sourceId })).toEqual([
      { id, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.', comment: null },
    ]);
  });

  it('needs an Excerpt or a Comment; Locator is optional', async () => {
    const { api, sourceId } = await scholarWithSource();

    await expect(api.notes.create({ id: uuidv7(), sourceId, locator: 's. 45' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    await expect(api.notes.create({ id: uuidv7(), sourceId, excerpt: '  ', comment: '\n' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: ' ', comment: '  Genel değerlendirme.\n' });

    expect(await api.notes.flow({ sourceId })).toEqual([
      { id, locator: null, excerpt: null, comment: 'Genel değerlendirme.' },
    ]);
  });

  it('is refused by the database when it has neither an Excerpt nor a Comment', async () => {
    const device = await t.signIn(scholarEmail());
    const { id: sourceId } = await (await device.call()).sources.create({ type: 'book', title: 'Tezâkir' });

    // Past the API's own check: only the table's constraint stands in the way.
    const insert = (values: { excerpt?: string; comment?: string }) =>
      withLibrary(t.db, device.accountId, (tx) =>
        tx.insert(note).values({ id: uuidv7(), accountId: device.accountId, sourceId, ...values }),
      );

    const refused = { cause: { constraint_name: 'note_has_text' } };
    await expect(insert({})).rejects.toMatchObject(refused);
    await expect(insert({ excerpt: ' \n\t', comment: '' })).rejects.toMatchObject(refused);
    await expect(insert({ comment: 'Yeterli.' })).resolves.toBeDefined();
  });

  it('needs a UUIDv7 id made on the device', async () => {
    const { api, sourceId } = await scholarWithSource();

    await expect(
      api.notes.create({ id: '0b8f1f9e-5c1e-4c55-8f0a-3d2b1c0a9e8d', sourceId, comment: 'v4' }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe("Capture's Source list", () => {
  it('puts the Source with the latest Note first, then Sources without Notes, newest first', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const kadi = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const tanin = await api.sources.create({ type: 'periodical', title: 'Tanin' });
    const dhmkt = await api.sources.create({ type: 'archive', title: 'DH.MKT', author: 'BOA' });
    await api.notes.create({ id: uuidv7(), sourceId: kadi.id, locator: 's. 12', comment: 'Bir' });
    await api.notes.create({ id: uuidv7(), sourceId: dhmkt.id, locator: 'gml. 3', comment: 'İki' });
    await api.notes.create({ id: uuidv7(), sourceId: kadi.id, locator: 's. 13', comment: 'Üç' });
    const tezakir = await api.sources.create({ type: 'book', title: 'Tezâkir', author: 'Ahmed Cevdet Paşa' });

    expect(await api.sources.byLastNote()).toEqual([
      { id: kadi.id, type: 'book', title: 'Taşrada Kadı ve Naib', author: null },
      { id: dhmkt.id, type: 'archive', title: 'DH.MKT', author: 'BOA' },
      { id: tezakir.id, type: 'book', title: 'Tezâkir', author: 'Ahmed Cevdet Paşa' },
      { id: tanin.id, type: 'periodical', title: 'Tanin', author: null },
    ]);
  });
});
