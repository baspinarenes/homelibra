import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

/** A Crossref work as api.crossref.org returns it (10.37879/belleten.2026.345, trimmed). */
const belleten = {
  DOI: '10.37879/belleten.2026.345',
  type: 'journal-article',
  title: ['Three Hittite Inscribed Artifacts from Erimtan Museum'],
  subtitle: [],
  author: [
    { given: 'Yiğit H.', family: 'Erbil', sequence: 'first' },
    { given: 'Alice', family: 'Mouton', sequence: 'additional' },
  ],
  'container-title': ['Belleten'],
  volume: '90',
  issue: '318',
  page: '345-362',
  issued: { 'date-parts': [[2026, 8, 1]] },
};

const DAY_MS = 24 * 60 * 60 * 1000;

describe('DOI ile doldur', () => {
  it('fills the Article form from Crossref, and asks Crossref only once for a DOI', async () => {
    t.crossref.publish(belleten);
    const api = await (await t.signIn(scholarEmail())).call();

    const filled = await api.lookups.doi({ doi: '10.37879/belleten.2026.345' });

    expect(filled).toEqual({
      doi: '10.37879/belleten.2026.345',
      title: 'Three Hittite Inscribed Artifacts from Erimtan Museum',
      author: 'Yiğit H. Erbil ve Alice Mouton',
      date: { calendar: 'gregorian', year: 2026 },
      fields: { container: 'Belleten', volumeIssue: '90/318', pageRange: '345-362' },
    });
    expect(await api.lookups.doi({ doi: '10.37879/belleten.2026.345' })).toEqual(filled);
    expect(t.crossref.askedFor('10.37879/belleten.2026.345')).toBe(1);
  });

  it('remembers "bulunamadı" for seven days, then asks Crossref again', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const doi = '10.18589/oa.2035352';

    expect(await api.lookups.doi({ doi })).toBeNull();
    // Crossref registers the work after the first try.
    t.crossref.publish({ ...belleten, DOI: doi, title: ['Bosnian Kadis'] });

    t.passTime(7 * DAY_MS - 60_000);
    expect(await api.lookups.doi({ doi })).toBeNull();
    expect(t.crossref.askedFor(doi)).toBe(1);

    t.passTime(60_000);
    expect(await api.lookups.doi({ doi })).toMatchObject({ title: 'Bosnian Kadis' });
    expect(t.crossref.askedFor(doi)).toBe(2);
  });

  it("keeps a scholar's corrections in their own Source, out of the cache every Library shares", async () => {
    const doi = '10.26650/iutd.1791665';
    t.crossref.publish({
      ...belleten,
      DOI: doi,
      title: ['Bir Portre Denemesi: Çingis Han’ın En Yakını Arulatlı Boorçu Noyan', 'A Portrait Attempt'],
      author: [
        { given: 'Burak', family: 'Çelik' },
        { given: 'Fatih', family: 'Çolak' },
      ],
      'container-title': ['Tarih Dergisi / Turkish Journal of History'],
      volume: '0',
      issue: '89',
      page: '1-19',
    });
    const first = await (await t.signIn(scholarEmail())).call();

    const filled = await first.lookups.doi({ doi: `https://doi.org/${doi.replace('iutd', 'IUTD')}` });
    const { id } = await first.sources.create({
      type: 'article',
      title: 'Bir Portre Denemesi',
      author: filled?.author,
      doi: filled?.doi,
      date: filled?.date,
      fields: { ...filled?.fields, volumeIssue: 'Sayı 89' },
    });

    const second = await (await t.signIn(scholarEmail())).call();
    expect(await second.lookups.doi({ doi })).toEqual({
      doi,
      title: 'Bir Portre Denemesi: Çingis Han’ın En Yakını Arulatlı Boorçu Noyan',
      author: 'Burak Çelik ve Fatih Çolak',
      date: { calendar: 'gregorian', year: 2026 },
      fields: { container: 'Tarih Dergisi / Turkish Journal of History', volumeIssue: 'S. 89', pageRange: '1-19' },
    });
    expect(t.crossref.askedFor(doi)).toBe(1);
    expect(await first.sources.get({ id })).toMatchObject({
      title: 'Bir Portre Denemesi',
      doi,
      fields: { volumeIssue: 'Sayı 89' },
    });
  });

  it('never refreshes what Crossref found', async () => {
    const doi = '10.35239/tariharastirmalari.1836499';
    t.crossref.publish({ ...belleten, DOI: doi });
    const api = await (await t.signIn(scholarEmail())).call();
    await api.lookups.doi({ doi });

    t.passTime(365 * DAY_MS);
    await api.lookups.doi({ doi });

    expect(t.crossref.askedFor(doi)).toBe(1);
  });

  it('refuses what is not a DOI', async () => {
    const api = await (await t.signIn(scholarEmail())).call();

    await expect(api.lookups.doi({ doi: '978-975-05-0000-0' })).rejects.toThrow();
  });
});
