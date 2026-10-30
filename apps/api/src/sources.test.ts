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
      fields: { publisher: 'İletişim', placeOfPublication: 'İstanbul' },
    });
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
