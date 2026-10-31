import { capturedAt } from '@homelibra/core/note';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}
type Api = Awaited<ReturnType<typeof scholar>>;

async function capture(api: Api, sourceId: string, tags?: string[]) {
  const id = uuidv7();
  await api.notes.create({ id, sourceId, excerpt: 'Alıntı.', tags });
  return id;
}

// Kaynaklar (#40, stories 163 and 165): "Son not" first, and on each row the
// Note count, when the last Note came and "N etiketsiz".
describe('Kaynaklar by Son not', () => {
  it('puts the Source noted last first, Sources without a Note last by Başlık', async () => {
    const api = await scholar();
    const { id: tanin } = await api.sources.create({ type: 'periodical', title: 'Tanin' });
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await api.sources.create({ type: 'archive', title: 'DH.MKT' });
    await api.sources.create({ type: 'archive', title: 'A.MKT' });
    await capture(api, kadi);
    await capture(api, tanin);
    await capture(api, kadi);

    const rows = await api.sources.list({ sort: 'last' });

    expect(rows.map((row) => row.title)).toEqual(['Taşrada Kadı ve Naib', 'Tanin', 'A.MKT', 'DH.MKT']);
  });

  it('gives each row its Note count, the last Note’s capture time and its untagged Notes', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await api.sources.create({ type: 'archive', title: 'DH.MKT' });
    await capture(api, sourceId, ['kadı']);
    await capture(api, sourceId);
    const last = await capture(api, sourceId);

    const rows = await api.sources.list({ sort: 'last' });

    expect(
      rows.map(({ title, noteCount, lastNoteAt, untaggedCount }) => ({ title, noteCount, lastNoteAt, untaggedCount })),
    ).toEqual([
      { title: 'Taşrada Kadı ve Naib', noteCount: 3, lastNoteAt: capturedAt(last).toISOString(), untaggedCount: 2 },
      { title: 'DH.MKT', noteCount: 0, lastNoteAt: null, untaggedCount: 0 },
    ]);
  });

  it('counts the untagged Notes Düzenle waits on: none left after "Bitir"', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, sourceId);
    await api.organize.finish({ sourceId });

    const [row] = await api.sources.list({ sort: 'last' });

    expect(row?.untaggedCount).toBe(0);
    expect(row?.noteCount).toBe(1);
  });
});

// Kaynaklar's Süz ve sırala (#122): the Tür filter keeps the Sources of the
// chosen types; with none chosen, every type.
describe('Tür filter in Kaynaklar', () => {
  it('keeps only the Sources of the chosen types, with the Tarih filter on top', async () => {
    const api = await scholar();
    await api.sources.create({ type: 'periodical', title: 'Tanin', date: { calendar: 'rumi', year: 1326 } });
    await api.sources.create({ type: 'archive', title: 'DH.MKT 1234/56', date: { calendar: 'hijri', year: 1327 } });
    await api.sources.create({ type: 'archive', title: 'A.MKT' });
    await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      date: { calendar: 'gregorian', year: 1993 },
    });

    const titles = async (input: Omit<Parameters<Api['sources']['list']>[0], 'sort'>) =>
      (await api.sources.list({ sort: 'title', ...input })).map((row) => row.title);

    expect(await titles({ types: ['archive', 'periodical'] })).toEqual(['A.MKT', 'DH.MKT 1234/56', 'Tanin']);
    expect(
      await titles({
        types: ['archive', 'periodical'],
        dates: { from: { calendar: 'rumi', year: 1324 }, to: { calendar: 'rumi', year: 1330 } },
      }),
    ).toEqual(['DH.MKT 1234/56', 'Tanin']);
  });

  it('keeps every type when none is chosen', async () => {
    const api = await scholar();
    await api.sources.create({ type: 'periodical', title: 'Tanin' });
    await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });

    for (const types of [[], null, undefined]) {
      expect(await api.sources.list({ sort: 'title', types })).toHaveLength(2);
    }
  });
});
