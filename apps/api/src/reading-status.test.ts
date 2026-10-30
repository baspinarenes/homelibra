import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

const hour = 60 * 60 * 1000;

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}
type Api = Awaited<ReturnType<typeof scholar>>;

/** Captures one Note per Locator, untagged unless Tags are given; returns their ids. */
async function capture(api: Api, sourceId: string, locators: string[], tags?: string[]) {
  const ids: string[] = [];
  for (const locator of locators) {
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator, excerpt: `${locator} üzerine.`, tags });
    ids.push(id);
  }
  return ids;
}

const statusOf = async (api: Api, id: string) => (await api.sources.get({ id })).readingStatus;

describe('Reading status', () => {
  it('starts as reading, and changes only when the scholar says so (#13)', async () => {
    const api = await scholar();
    const { id } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    expect(await statusOf(api, id)).toBe('reading');

    await api.sources.setReadingStatus({ id, status: 'finished' });
    expect(await statusOf(api, id)).toBe('finished');

    // Back to a finished book for one more Note: it stays finished.
    await capture(api, id, ['s. 210']);
    expect(await statusOf(api, id)).toBe('finished');

    await api.sources.setReadingStatus({ id, status: 'reading' });
    expect(await statusOf(api, id)).toBe('reading');
  });

  it('says, on finishing, how many untagged Notes came since the last Bitir, for "Şimdi düzenle / Sonra"', async () => {
    const api = await scholar();
    const { id } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, id, ['s. 1', 's. 2'], ['kadı']);
    await capture(api, id, ['s. 3']);
    await api.organize.finish({ sourceId: id });
    t.passTime(hour);
    await capture(api, id, ['s. 40', 's. 41', 's. 42']);
    await capture(api, id, ['s. 43'], ['naib']);

    expect(await api.sources.setReadingStatus({ id, status: 'finished' })).toEqual({ untaggedCount: 3 });
    // Already finished: nothing to offer again; reading on: nothing to offer.
    expect(await api.sources.setReadingStatus({ id, status: 'finished' })).toEqual({ untaggedCount: 0 });
    expect(await api.sources.setReadingStatus({ id, status: 'reading' })).toEqual({ untaggedCount: 0 });

    await api.organize.finish({ sourceId: id });
    expect(await api.sources.setReadingStatus({ id, status: 'finished' })).toEqual({ untaggedCount: 0 });
  });

  it('keeps finished Sources out of Ana sayfa\'s "Son not aldığın" while a Source being read has a Note', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    await api.sources.create({ type: 'book', title: 'Henüz Notu Yok' });
    await capture(api, kadi, ['s. 45']);
    t.passTime(hour);
    await capture(api, vakif, ['s. 10']);
    expect((await api.sources.lastNoted())?.source.title).toBe("Osmanlı'da Vakıf");

    await api.sources.setReadingStatus({ id: vakif, status: 'finished' });
    expect(await api.sources.lastNoted()).toMatchObject({
      source: { title: 'Taşrada Kadı ve Naib' },
      note: { locator: 's. 45' },
    });

    // Nothing being read has a Note: the last Note of all, rather than nothing.
    await api.sources.setReadingStatus({ id: kadi, status: 'finished' });
    expect((await api.sources.lastNoted())?.source.title).toBe("Osmanlı'da Vakıf");
  });

  it('lists the Sources being read for Ana sayfa, the last noted first, then the ones without a Note, newest first', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib', author: 'Ortaylı' });
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    const { id: tanin } = await api.sources.create({ type: 'periodical', title: 'Tanin' });
    await api.sources.create({ type: 'archive', title: 'DH.MKT' });
    t.passTime(hour);
    await api.sources.create({ type: 'archive', title: 'A.MKT.MHM' });
    await capture(api, vakif, ['s. 10']);
    t.passTime(hour);
    await capture(api, kadi, ['s. 45']);
    t.passTime(hour);
    await capture(api, tanin, ['nr. 3']);
    await api.sources.setReadingStatus({ id: tanin, status: 'finished' });

    const reading = await api.sources.reading();

    expect(reading.map(({ title }) => title)).toEqual([
      'Taşrada Kadı ve Naib',
      "Osmanlı'da Vakıf",
      'A.MKT.MHM',
      'DH.MKT',
    ]);
    expect(reading[0]).toMatchObject({ id: kadi, type: 'book', author: 'Ortaylı', cover: null });
  });

  it('comes with every Source on the Kaynaklar list, for its Okunuyor and Bitti sections', async () => {
    const api = await scholar();
    await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: tanin } = await api.sources.create({ type: 'periodical', title: 'Tanin' });
    await api.sources.setReadingStatus({ id: tanin, status: 'finished' });

    const rows = await api.sources.list({ sort: 'title' });

    expect(rows.map(({ title, readingStatus }) => [title, readingStatus])).toEqual([
      ['Tanin', 'finished'],
      ['Taşrada Kadı ve Naib', 'reading'],
    ]);
  });

  it('puts the finished Sources first in Düzenlenecekler, marked, then the rest by last Note', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    const { id: fon } = await api.sources.create({ type: 'archive', title: 'A.MKT.MHM' });
    const { id: tanin } = await api.sources.create({ type: 'periodical', title: 'Tanin' });
    await capture(api, kadi, ['s. 45']);
    t.passTime(hour);
    await capture(api, fon, ['g. 3']);
    t.passTime(hour);
    await capture(api, vakif, ['s. 10']);
    t.passTime(hour);
    await capture(api, tanin, ['nr. 3']);
    await api.sources.setReadingStatus({ id: kadi, status: 'finished' });
    await api.sources.setReadingStatus({ id: fon, status: 'finished' });

    const rows = await api.organize.list();

    expect(rows.map(({ title, finished }) => [title, finished])).toEqual([
      ['A.MKT.MHM', true],
      ['Taşrada Kadı ve Naib', true],
      ['Tanin', false],
      ["Osmanlı'da Vakıf", false],
    ]);
  });

  it('comes back with a deleted Source on Geri al', async () => {
    const api = await scholar();
    const { id } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, id, ['s. 45']);
    await api.sources.setReadingStatus({ id, status: 'finished' });

    const { undoToken } = await api.sources.delete({ id });
    await api.undo({ token: undoToken! });

    expect(await statusOf(api, id)).toBe('finished');
  });

  it("cannot reach another Library's Source", async () => {
    const api = await scholar();
    const { id } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const stranger = await scholar();

    await expect(stranger.sources.setReadingStatus({ id, status: 'finished' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    expect(await statusOf(api, id)).toBe('reading');
  });
});
