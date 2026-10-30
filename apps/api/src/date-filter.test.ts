import type { YearRange } from '@homelibra/core/date';
import { uuidv7 } from 'uuidv7';
import { beforeAll, describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

type Api = Awaited<ReturnType<Awaited<ReturnType<typeof t.signIn>>['call']>>;

let api: Api;
/** The Sources by Başlık, and each one's Note. */
const sources = new Map<string, string>();
const notes = new Map<string, string>();

// Four Sources on the Second Constitutional era, each with one Note: dated
// in Rumî (Mart 1908), Hicrî (1913–14) and Milâdî (1876), and one undated.
beforeAll(async () => {
  api = await (await t.signIn(scholarEmail())).call();
  const add = async (title: string, date?: Parameters<Api['sources']['create']>[0]['date']) => {
    const { id } = await api.sources.create({ type: 'periodical', title, date });
    sources.set(title, id);
    const noteId = uuidv7();
    await api.notes.create({ id: noteId, sourceId: id, excerpt: 'Meşrutiyet ilan edildi.' });
    notes.set(title, noteId);
  };
  await add('Tanin, Meşrutiyet yazıları', { calendar: 'rumi', year: 1324, month: 3 });
  await add('Takvim-i Vekayi, Meşrutiyet sayısı', { calendar: 'hijri', year: 1332 });
  await add('Kanun-ı Esasi, Meşrutiyet metni', { calendar: 'gregorian', year: 1876 });
  await add('Meşrutiyet defteri');
});

const titleOf = (id: string, of: Map<string, string>) => [...of].find(([, value]) => value === id)?.[0];

/** The titles of the Sources an Ara search keeps, and of the Sources of the Notes it keeps. */
async function ara(dates: YearRange | null) {
  const found = await api.search.library({ query: 'meşrutiyet', dates });
  return {
    sources: found.sources.map((s) => titleOf(s.id, sources)).sort(),
    notes: found.notes.map((n) => titleOf(n.id, notes)).sort(),
    hiddenUndated: found.hiddenUndated,
  };
}

describe('Tarih filter in Ara', () => {
  it('keeps Sources and Notes by the Source’s Date across calendars, hiding the undated (Rumî years)', async () => {
    const kept = ['Takvim-i Vekayi, Meşrutiyet sayısı', 'Tanin, Meşrutiyet yazıları'];
    expect(await ara({ from: { calendar: 'rumi', year: 1324 }, to: { calendar: 'rumi', year: 1330 } })).toEqual({
      sources: kept,
      notes: kept,
      hiddenUndated: { sources: 1, notes: 1 },
    });
  });

  it('filters by Hicrî years', async () => {
    const found = await ara({ from: { calendar: 'hijri', year: 1326 }, to: { calendar: 'hijri', year: 1331 } });
    expect(found.notes).toEqual(['Tanin, Meşrutiyet yazıları']);
    expect(found.sources).toEqual(['Tanin, Meşrutiyet yazıları']);
  });

  it('leaves a side without a year open', async () => {
    const found = await ara({ from: { calendar: 'gregorian', year: 1870 } });
    expect(found.notes).toEqual([
      'Kanun-ı Esasi, Meşrutiyet metni',
      'Takvim-i Vekayi, Meşrutiyet sayısı',
      'Tanin, Meşrutiyet yazıları',
    ]);
    expect(found.hiddenUndated).toEqual({ sources: 1, notes: 1 });
  });

  it('hides nothing without a year', async () => {
    for (const dates of [null, {}]) {
      const found = await ara(dates);
      expect(found.notes).toHaveLength(4);
      expect(found.sources).toHaveLength(4);
      expect(found.hiddenUndated).toEqual({ sources: 0, notes: 0 });
    }
  });

  it('refuses a year its calendar does not have', async () => {
    await expect(
      api.search.library({ query: 'meşrutiyet', dates: { from: { calendar: 'rumi', year: 1400 } } }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('Tarih filter in Kaynaklar', () => {
  const listed = async (dates: YearRange | null) =>
    (await api.sources.list({ sort: 'date', dates })).map((row) => row.title);

  it('keeps the Sources dated in the years, in any calendar, and hides the undated (Rumî years)', async () => {
    expect(await listed({ from: { calendar: 'rumi', year: 1324 }, to: { calendar: 'rumi', year: 1330 } })).toEqual([
      'Tanin, Meşrutiyet yazıları',
      'Takvim-i Vekayi, Meşrutiyet sayısı',
    ]);
  });

  it('filters by Hicrî years', async () => {
    expect(await listed({ from: { calendar: 'hijri', year: 1290 }, to: { calendar: 'hijri', year: 1326 } })).toEqual([
      'Kanun-ı Esasi, Meşrutiyet metni',
      'Tanin, Meşrutiyet yazıları',
    ]);
  });

  it('lists every Source without a year', async () => {
    expect(await listed(null)).toHaveLength(4);
    expect(await listed({})).toHaveLength(4);
  });
});
