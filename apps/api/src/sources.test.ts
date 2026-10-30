import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

describe('Source', () => {
  it('is created with its fields and read back as entered', async () => {
    const api = await (await t.signIn(scholarEmail())).call();

    const { id } = await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      isbn: '978-975-05-0000-0',
      bibliographicNote: 'Çev. yok; 2. baskıdan.',
      fields: { publisher: 'İletişim', placeOfPublication: 'İstanbul' },
    });

    expect(await api.sources.get({ id })).toEqual({
      id,
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      author: null,
      isbn: '978-975-05-0000-0',
      doi: null,
      bibliographicNote: 'Çev. yok; 2. baskıdan.',
      date: null,
      fields: { publisher: 'İletişim', placeOfPublication: 'İstanbul' },
      tags: [],
    });
  });

  it('keeps its Dates in the calendar and precision they were entered in', async () => {
    const api = await (await t.signIn(scholarEmail())).call();

    const { id } = await api.sources.create({
      type: 'book',
      title: 'Osmanlı İmparatorluğu Klasik Çağ',
      date: { calendar: 'gregorian', year: 2003 },
      fields: { firstEditionDate: { calendar: 'gregorian', year: 1973 } },
    });
    const archive = await api.sources.create({
      type: 'archive',
      title: 'DH.MKT 1234/56',
      date: { calendar: 'hijri', year: 1310, month: 12, day: 29 },
    });

    expect(await api.sources.get({ id })).toMatchObject({
      date: { calendar: 'gregorian', year: 2003 },
      fields: { firstEditionDate: { calendar: 'gregorian', year: 1973 } },
    });
    expect((await api.sources.get(archive)).date).toEqual({ calendar: 'hijri', year: 1310, month: 12, day: 29 });
  });

  it('refuses a Date its calendar does not have', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const dropped = { calendar: 'rumi', year: 1332, month: 2, day: 20 } as const;

    await expect(api.sources.create({ type: 'periodical', title: 'Tanin', date: dropped })).rejects.toThrow();
    await expect(
      api.sources.create({
        type: 'webPage',
        title: 'Sayfa',
        fields: { accessDate: { ...dropped, calendar: 'hijri', day: 30 } },
      }),
    ).rejects.toThrow();
  });

  it('keeps Erişim tarihi Milâdî', async () => {
    const api = await (await t.signIn(scholarEmail())).call();

    await expect(
      api.sources.create({
        type: 'webPage',
        title: 'Sayfa',
        fields: { accessDate: { calendar: 'hijri', year: 1448, month: 5, day: 1 } },
      }),
    ).rejects.toThrow();
  });

  it('clears a Date the scholar empties', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id } = await api.sources.create({
      type: 'webPage',
      title: 'Sayfa',
      date: { calendar: 'gregorian', year: 2024 },
      fields: { siteName: 'Kurum', accessDate: { calendar: 'gregorian', year: 2026, month: 10, day: 30 } },
    });

    await api.sources.update({ id, date: null, fields: { accessDate: null } });

    expect(await api.sources.get({ id })).toMatchObject({ date: null, fields: { siteName: 'Kurum' } });
    expect((await api.sources.get({ id })).fields).not.toHaveProperty('accessDate');
  });

  it('needs only a type and a title', async () => {
    const api = await (await t.signIn(scholarEmail())).call();

    const { id } = await api.sources.create({ type: 'archive', title: 'DH.MKT 1234/56', author: 'BOA' });

    expect(await api.sources.get({ id })).toMatchObject({ type: 'archive', title: 'DH.MKT 1234/56', author: 'BOA' });
    await expect(api.sources.create({ type: 'archive', title: '   ' })).rejects.toThrow();
  });

  it('is updated in place', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id } = await api.sources.create({ type: 'archive', title: 'DH.MKT', author: 'BOA' });

    await api.sources.update({ id, title: 'DH.MKT 1234/56', bibliographicNote: 'Dahiliye Mektubi Kalemi' });

    expect(await api.sources.get({ id })).toMatchObject({
      type: 'archive',
      title: 'DH.MKT 1234/56',
      author: 'BOA',
      bibliographicNote: 'Dahiliye Mektubi Kalemi',
    });
  });

  it('keeps the fields a new type hides, and shows them again on the way back', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id } = await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      isbn: '978-975-05-0000-0',
      fields: { publisher: 'İletişim', edition: '3. baskı' },
    });

    await api.sources.update({ id, type: 'article', fields: { container: 'Belleten' } });
    expect(await api.sources.get({ id })).toMatchObject({
      type: 'article',
      isbn: '978-975-05-0000-0',
      fields: { publisher: 'İletişim', edition: '3. baskı', container: 'Belleten' },
    });

    await api.sources.update({ id, type: 'book' });
    expect(await api.sources.get({ id })).toMatchObject({
      type: 'book',
      isbn: '978-975-05-0000-0',
      fields: { publisher: 'İletişim', edition: '3. baskı', container: 'Belleten' },
    });
  });

  it('empties a field the scholar clears', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id } = await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      author: 'Yanlış Yazar',
      fields: { publisher: 'İletişim', edition: '3. baskı' },
    });

    await api.sources.update({ id, author: '', fields: { edition: ' ' } });

    expect(await api.sources.get({ id })).toMatchObject({ author: null, fields: { publisher: 'İletişim' } });
    expect((await api.sources.get({ id })).fields).not.toHaveProperty('edition');
  });
});

describe('Source list', () => {
  async function libraryWithFiveSources() {
    const api = await (await t.signIn(scholarEmail())).call();
    await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await api.sources.create({ type: 'archive', title: 'DH.MKT', author: 'BOA' });
    await api.sources.create({ type: 'periodical', title: 'Tanin' });
    await api.sources.create({ type: 'article', title: 'Çanakkale Cephesi', author: 'Çelik' });
    await api.sources.create({ type: 'book', title: 'Cevdet Paşa Tezâkir', author: 'Ahmed Cevdet Paşa' });
    return api;
  }

  it('lists by title in Turkish alphabetical order, with type and author', async () => {
    const api = await libraryWithFiveSources();

    const rows = await api.sources.list({ sort: 'title' });

    expect(rows.map(({ type, title, author }) => [type, title, author])).toEqual([
      ['book', 'Cevdet Paşa Tezâkir', 'Ahmed Cevdet Paşa'],
      ['article', 'Çanakkale Cephesi', 'Çelik'],
      ['archive', 'DH.MKT', 'BOA'],
      ['periodical', 'Tanin', null],
      ['book', 'Taşrada Kadı ve Naib', null],
    ]);
  });

  it('lists by author, Sources without one last by title', async () => {
    const api = await libraryWithFiveSources();

    const rows = await api.sources.list({ sort: 'author' });

    expect(rows.map((row) => row.title)).toEqual([
      'Cevdet Paşa Tezâkir',
      'DH.MKT',
      'Çanakkale Cephesi',
      'Tanin',
      'Taşrada Kadı ve Naib',
    ]);
  });
});

describe('Source list by Date', () => {
  it('orders Sources of every calendar by their Date, undated ones last by title', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await api.sources.create({ type: 'periodical', title: 'Tanin', date: { calendar: 'rumi', year: 1324, month: 10 } });
    await api.sources.create({ type: 'archive', title: 'DH.MKT', date: { calendar: 'hijri', year: 1310 } });
    await api.sources.create({
      type: 'book',
      title: 'Cevdet Paşa',
      date: { calendar: 'gregorian', year: 1893, month: 3, day: 5 },
    });
    await api.sources.create({
      type: 'archive',
      title: 'A.MKT',
      date: { calendar: 'hijri', year: 1310, month: 1, day: 1 },
    });
    await api.sources.create({ type: 'other', title: 'Harita' });

    const rows = await api.sources.list({ sort: 'date' });

    expect(rows.map(({ title, date }) => [title, date])).toEqual([
      ['DH.MKT', { calendar: 'hijri', year: 1310 }], // 26 Temmuz 1892, coarser first
      ['A.MKT', { calendar: 'hijri', year: 1310, month: 1, day: 1 }], // 26 Temmuz 1892
      ['Cevdet Paşa', { calendar: 'gregorian', year: 1893, month: 3, day: 5 }],
      ['Tanin', { calendar: 'rumi', year: 1324, month: 10 }], // 14 Ekim 1908
      ['Harita', null],
      ['Taşrada Kadı ve Naib', null],
    ]);
  });

  it('moves a Source when its Date changes', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id } = await api.sources.create({
      type: 'book',
      title: 'Sonra',
      date: { calendar: 'gregorian', year: 1950 },
    });
    await api.sources.create({ type: 'book', title: 'Önce', date: { calendar: 'gregorian', year: 1900 } });

    await api.sources.update({ id, date: { calendar: 'rumi', year: 1300 } });

    expect((await api.sources.list({ sort: 'date' })).map((row) => row.title)).toEqual(['Sonra', 'Önce']);
  });
});
