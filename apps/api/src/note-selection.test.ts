import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

const hour = 60 * 60 * 1000;

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}
type Api = Awaited<ReturnType<typeof scholar>>;

type Draft = { locator: string; excerpt?: string; comment?: string; tags?: string[] };

/** Captures these Notes in order; returns their ids. */
async function capture(api: Api, sourceId: string, drafts: Draft[]) {
  const ids: string[] = [];
  for (const draft of drafts) {
    const id = uuidv7();
    await api.notes.create({ id, sourceId, excerpt: `${draft.locator} üzerine.`, ...draft });
    ids.push(id);
  }
  return ids;
}

const pages = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ locator: `s. ${from + i}` }));

describe('Toplu silme', () => {
  it('takes the selected Notes away at once, and one Geri al brings all of them back (#36, scenario 2)', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, kadi, pages(10, 14));
    // Three Notes captured twice, one of the doubles tagged.
    const doubles = await capture(api, kadi, [
      { locator: 's. 10' },
      { locator: 's. 12', tags: ['naib'] },
      { locator: 's. 14' },
    ]);
    const before = await api.notes.list({ sourceId: kadi });

    const { count, undoToken } = await api.notes.deleteMany({ ids: doubles });

    expect(count).toBe(3);
    expect((await api.notes.list({ sourceId: kadi })).map((n) => n.locator)).toEqual(
      pages(10, 14).map((p) => p.locator),
    );
    expect(await api.tags.list({ sort: 'name' })).toEqual([]);

    // The wrong ones were picked: Geri al.
    await api.undo({ token: undoToken! });

    expect(await api.notes.list({ sourceId: kadi })).toEqual(before);
    expect((await api.tags.list({ sort: 'name' })).map((tag) => tag.name)).toEqual(['naib']);
  });

  it("deletes only this Library's Notes still there, and offers no Geri al when none is", async () => {
    const api = await scholar();
    const theirs = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: other } = await theirs.sources.create({ type: 'book', title: 'Başka' });
    const [mine] = await capture(api, kadi, [{ locator: 's. 1' }]);
    const [notMine] = await capture(theirs, other, [{ locator: 's. 1' }]);

    expect(await api.notes.deleteMany({ ids: [mine!, notMine!] })).toEqual({
      count: 1,
      undoToken: expect.any(String),
    });
    expect(await api.notes.deleteMany({ ids: [mine!, notMine!] })).toEqual({ count: 0, undoToken: null });

    expect(await theirs.notes.list({ sourceId: other })).toHaveLength(1);
  });
});

describe('Note merge', () => {
  it('joins a quotation cut by a page turn, half of it tagged, into its first Note; Geri al undoes it (#13, scenario 4)', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    // The second half was tagged in Capture; the first half and the Note between them were not.
    const [first, between, second] = await capture(api, kadi, [
      { locator: 's. 27', excerpt: 'Kadı, naibini', comment: 'Bölünmüş alıntı.' },
      { locator: 's. 27', excerpt: 'Araya giren not.' },
      { locator: 's. 28', excerpt: 'kendisi seçerdi.', comment: 'Bkz. s. 112.', tags: ['naib', 'vekâlet'] },
    ]);
    await api.notes.update({ id: first!, tags: ['kadı'] });
    const before = await api.notes.list({ sourceId: kadi });

    // Not side by side, and picked in any order.
    const { id, undoToken } = await api.notes.merge({ ids: [second!, first!] });

    expect(id).toBe(first);
    expect(await api.notes.list({ sourceId: kadi })).toEqual([
      {
        id: first,
        locator: 's. 27',
        locatorSort: [27],
        excerpt: 'Kadı, naibini\n\nkendisi seçerdi.',
        comment: 'Bölünmüş alıntı.\n\nBkz. s. 112.',
        tags: [
          expect.objectContaining({ name: 'kadı' }),
          expect.objectContaining({ name: 'naib' }),
          expect.objectContaining({ name: 'vekâlet' }),
        ],
      },
      expect.objectContaining({ id: between }),
    ]);
    await expect(api.notes.get({ id: second! })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect((await api.tags.list({ sort: 'name' })).map((tag) => tag.name)).toEqual(['kadı', 'naib', 'vekâlet']);

    await api.undo({ token: undoToken! });

    expect(await api.notes.list({ sourceId: kadi })).toEqual(before);
  });

  it('takes the Locator and the texts as corrected in the preview', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const ids = await capture(api, kadi, [
      { locator: 's. 45', excerpt: 'Naiplik,' },
      { locator: 's. 46', excerpt: 'bir vekâletti.' },
    ]);

    await api.notes.merge({ ids, locator: 's. 45–46', excerpt: 'Naiplik bir vekâletti.', comment: ' Tek cümle. ' });

    expect(await api.notes.list({ sourceId: kadi })).toEqual([
      {
        id: ids[0],
        locator: 's. 45–46',
        locatorSort: [45, 46],
        excerpt: 'Naiplik bir vekâletti.',
        comment: 'Tek cümle.',
        tags: [],
      },
    ]);
  });

  it('refuses Notes of two Sources, a Note not there, and a merge left without text', async () => {
    const api = await scholar();
    const theirs = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    const { id: other } = await theirs.sources.create({ type: 'book', title: 'Başka' });
    const [a, b] = await capture(api, kadi, [{ locator: 's. 1' }, { locator: 's. 2' }]);
    const [elsewhere] = await capture(api, vakif, [{ locator: 's. 1' }]);
    const [notMine] = await capture(theirs, other, [{ locator: 's. 1' }]);
    const before = await api.notes.list({ sourceId: kadi });

    await expect(api.notes.merge({ ids: [a!, elsewhere!] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(api.notes.merge({ ids: [a!, notMine!] })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(api.notes.merge({ ids: [a!, a!] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(api.notes.merge({ ids: [a!, b!], excerpt: '', comment: ' ' })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });

    expect(await api.notes.list({ sourceId: kadi })).toEqual(before);
    expect(await theirs.notes.list({ sourceId: other })).toHaveLength(1);
  });
});

describe('Toplu taşıma', () => {
  it('carries many Notes to another Source; the untagged ones count there as "yeni", and Geri al takes them all back', async () => {
    const api = await scholar();
    // "Taşrada Kadı" and "Taşrada Kadı ve Naib" were opened apart by quick adding (#36, scenario 4).
    const { id: short } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı' });
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, kadi, [{ locator: 's. 3', tags: ['kadı'] }]);
    await api.organize.finish({ sourceId: kadi });
    t.passTime(hour);
    const moved = await capture(api, short, [
      { locator: 's. 40' },
      { locator: 's. 41', tags: ['naib'] },
      { locator: 's. 42' },
      { locator: 's. 43' },
      { locator: 's. 44' },
    ]);
    const before = await api.notes.list({ sourceId: short });
    t.passTime(hour);

    const { count, undoToken } = await api.notes.moveMany({ ids: moved, sourceId: kadi });

    expect(count).toBe(5);
    expect(await api.notes.list({ sourceId: short })).toEqual([]);
    expect((await api.notes.list({ sourceId: kadi })).map((n) => n.locator)).toEqual([
      's. 3',
      's. 40',
      's. 41',
      's. 42',
      's. 43',
      's. 44',
    ]);
    const organizing = await api.organize.source({ sourceId: kadi });
    expect(organizing.untaggedCount).toBe(4);
    expect([...organizing.newNoteIds].sort()).toEqual([...moved].sort());

    await api.undo({ token: undoToken! });

    expect(await api.notes.list({ sourceId: short })).toEqual(before);
    expect((await api.notes.list({ sourceId: kadi })).map((n) => n.locator)).toEqual(['s. 3']);
    expect(await api.organize.source({ sourceId: kadi })).toMatchObject({ untaggedCount: 0, newNoteIds: [] });
  });

  it('leaves the Notes already there, says "kaynak yok" for a Source not in this Library, and skips Notes not in it', async () => {
    const api = await scholar();
    const theirs = await scholar();
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: other } = await theirs.sources.create({ type: 'book', title: 'Başka' });
    const [there] = await capture(api, kadi, [{ locator: 's. 1' }]);
    const [notMine] = await capture(theirs, other, [{ locator: 's. 1' }]);

    expect(await api.notes.moveMany({ ids: [there!, notMine!], sourceId: kadi })).toEqual({
      count: 0,
      undoToken: null,
    });
    await expect(api.notes.moveMany({ ids: [there!], sourceId: other })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'SOURCE_NOT_FOUND',
    });
    expect(await api.notes.moveMany({ ids: [there!, notMine!], sourceId: vakif })).toMatchObject({ count: 1 });

    expect(await theirs.notes.list({ sourceId: other })).toHaveLength(1);
  });
});
