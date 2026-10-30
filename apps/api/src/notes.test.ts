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

describe("A Source's Notes in Locator order", () => {
  it('come without a Locator first, then unsortable Locators, then by sort value, oldest first on a tie', async () => {
    const { api, sourceId } = await scholarWithSource();
    const capture = async (locator: string | null) => {
      const id = uuidv7();
      await api.notes.create({ id, sourceId, locator, comment: locator ?? 'Konumsuz' });
      return id;
    };
    const s47 = await capture('s. 47');
    const preface = await capture('Önsöz');
    const s45 = await capture('s. 45');
    const whole = await capture(null);
    const footnote = await capture('s. 45, dn. 12');
    const s45Again = await capture('s. 45');
    const range = await capture('ss. 45-47');

    const notes = await api.notes.list({ sourceId });

    expect(notes.map((n) => n.id)).toEqual([whole, preface, s45, s45Again, footnote, range, s47]);
    expect(notes.find((n) => n.id === footnote)).toEqual({
      id: footnote,
      locator: 's. 45, dn. 12',
      locatorSort: [45, 12],
      excerpt: null,
      comment: 's. 45, dn. 12',
    });
  });

  it('are listed only for a Source in this Library', async () => {
    const { sourceId } = await scholarWithSource();
    const stranger = await (await t.signIn(scholarEmail())).call();

    await expect(stranger.notes.list({ sourceId })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('Note editing', () => {
  it('changes the Locator, Excerpt and Comment', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: 's. 45', excerpt: 'Kadı naibini seçerdi.' });

    await api.notes.update({ id, locator: 's. 46', excerpt: 'Kadı, naibini kendisi seçerdi.', comment: 'Kiralama?' });

    expect(await api.notes.get({ id })).toEqual({
      id,
      sourceId,
      locator: 's. 46',
      locatorSort: [46],
      excerpt: 'Kadı, naibini kendisi seçerdi.',
      comment: 'Kiralama?',
    });
  });

  it('keeps a corrected sort value until the Locator text changes, then derives it again', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: '29 Z 1310, 1234/56', excerpt: 'İrade.' });

    await api.notes.update({ id, locatorSort: [1234, 56, 29, 1310] });
    await api.notes.update({ id, comment: 'Tarih önce yazılmış.' });
    expect(await api.notes.get({ id })).toMatchObject({ locatorSort: [1234, 56, 29, 1310] });

    await api.notes.update({ id, locator: '29 Z 1310, 1234/57' });
    expect(await api.notes.get({ id })).toMatchObject({ locatorSort: [29, 1310, 1234, 57] });
  });

  it('takes a corrected sort value given with a new Locator, and derives it again when asked', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: 'Önsöz', comment: 'Giriş.' });

    await api.notes.update({ id, locator: 'Önsöz, s. xii', locatorSort: [0, 12] });
    expect(await api.notes.get({ id })).toMatchObject({ locatorSort: [0, 12] });

    await api.notes.update({ id, locatorSort: null });
    expect(await api.notes.get({ id })).toMatchObject({ locatorSort: null });
  });

  it('takes only whole numbers and folio halves as a sort value', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: 'vr. 12', excerpt: 'Ferman.' });

    await expect(api.notes.update({ id, locatorSort: [12.25] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await api.notes.update({ id, locatorSort: [12.5] });
    expect(await api.notes.get({ id })).toMatchObject({ locatorSort: [12.5] });
  });

  it('cannot leave a Note without an Excerpt or a Comment', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, excerpt: 'Kadı.', comment: 'Naip.' });

    await api.notes.update({ id, excerpt: ' ' });
    await expect(api.notes.update({ id, comment: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(await api.notes.get({ id })).toMatchObject({ excerpt: null, comment: 'Naip.' });
  });

  it("cannot reach another Library's Note", async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Benim.' });
    const stranger = await (await t.signIn(scholarEmail())).call();

    await expect(stranger.notes.get({ id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(stranger.notes.update({ id, comment: 'Senin.' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await api.notes.get({ id })).toMatchObject({ comment: 'Benim.' });
  });
});

describe("Ana sayfa's last noted Source", () => {
  it('is the Source of the latest Note, with that Note', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const kadi = await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      author: 'Halil İnalcık',
      date: { calendar: 'gregorian', year: 1965 },
    });
    const dhmkt = await api.sources.create({ type: 'archive', title: 'DH.MKT', author: 'BOA' });
    await api.notes.create({ id: uuidv7(), sourceId: dhmkt.id, locator: '1234/56', comment: 'Önce' });
    const last = uuidv7();
    await api.notes.create({ id: last, sourceId: kadi.id, locator: 's. 45', excerpt: 'Kadı, naibini seçerdi.' });

    expect(await api.sources.lastNoted()).toEqual({
      source: {
        id: kadi.id,
        type: 'book',
        title: 'Taşrada Kadı ve Naib',
        author: 'Halil İnalcık',
        date: { calendar: 'gregorian', year: 1965 },
      },
      note: {
        id: last,
        locator: 's. 45',
        excerpt: 'Kadı, naibini seçerdi.',
        comment: null,
        capturedAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
      },
    });
  });

  it('is nothing while the Library has no Notes', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    await api.sources.create({ type: 'book', title: 'Tezâkir' });

    expect(await api.sources.lastNoted()).toBeNull();
  });
});
