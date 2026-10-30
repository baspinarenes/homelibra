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

const pages = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `s. ${from + i}`);

/** Düzenlenecekler as titles and counts. */
const toOrganize = async (api: Api) =>
  (await api.organize.list()).map(({ title, untaggedCount }) => ({ title, untaggedCount }));

describe('Düzenlenecekler', () => {
  it("lists the Sources with untagged Notes and how many; before any Bitir, all of a Source's untagged Notes", async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    const { id: tagged } = await api.sources.create({ type: 'article', title: 'Etiketli Makale' });
    await api.sources.create({ type: 'book', title: 'Boş Kitap' });
    await capture(api, kadi, pages(1, 6), ['naib']);
    await capture(api, kadi, pages(7, 34));
    await capture(api, tagged, ['s. 3'], ['vakıf']);
    t.passTime(hour);
    await capture(api, vakif, ['s. 10', 's. 11']);

    // The last noted first.
    expect(await toOrganize(api)).toEqual([
      { title: "Osmanlı'da Vakıf", untaggedCount: 2 },
      { title: 'Taşrada Kadı ve Naib', untaggedCount: 28 },
    ]);
  });
});

describe('Bitir', () => {
  it('drops the Source from Düzenlenecekler until an untagged Note comes after it (#13, scenarios 1 and 3)', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, kadi, pages(1, 6), ['kadı']);
    const untagged = await capture(api, kadi, pages(7, 34));
    const dizin = untagged.at(-1)!;
    // Everything but "Dizin iyi" gets a Tag; that one is left untagged on purpose.
    await api.organize.tag({ noteIds: untagged.slice(0, -1), names: ['naib'] });
    expect(await toOrganize(api)).toEqual([{ title: 'Taşrada Kadı ve Naib', untaggedCount: 1 }]);

    await api.organize.finish({ sourceId: kadi });

    expect(await toOrganize(api)).toEqual([]);
    expect(await api.organize.source({ sourceId: kadi })).toMatchObject({ untaggedCount: 0, newNoteIds: [] });

    // Weeks later, back to the finished book for two more Notes.
    t.passTime(21 * 24 * hour);
    const later = await capture(api, kadi, ['s. 210', 's. 214']);

    expect(await toOrganize(api)).toEqual([{ title: 'Taşrada Kadı ve Naib', untaggedCount: 2 }]);
    const organizing = await api.organize.source({ sourceId: kadi });
    expect(organizing).toMatchObject({ untaggedCount: 2, lastFinishedAt: expect.any(String) });
    expect([...organizing.newNoteIds].sort()).toEqual([...later].sort());
    // "Dizin iyi", left before, is still among the untagged in the Source's list.
    const stillUntagged = (await api.notes.list({ sourceId: kadi })).filter((n) => n.tags.length === 0);
    expect(stillUntagged.map((n) => n.id)).toEqual([dizin, ...later]);
  });

  it('is fine with nothing done; a Source tagged as a whole drops out, its Notes still untagged (#13, scenario 2)', async () => {
    const api = await scholar();
    const { id: fon } = await api.sources.create({ type: 'archive', title: 'A.MKT.MHM' });
    await capture(api, fon, pages(1, 41));
    await api.tags.setOnSource({ sourceId: fon, names: ['Ermeni meselesi'] });
    expect(await toOrganize(api)).toEqual([{ title: 'A.MKT.MHM', untaggedCount: 41 }]);

    await api.organize.finish({ sourceId: fon });

    expect(await toOrganize(api)).toEqual([]);
    expect((await api.notes.list({ sourceId: fon })).every((n) => n.tags.length === 0)).toBe(true);
  });

  it('is not undone by taking a Tag off a Note afterwards', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const [id] = await capture(api, kadi, ['s. 40'], ['vekâlet']);
    await api.organize.finish({ sourceId: kadi });
    t.passTime(hour);

    await api.notes.update({ id: id!, tags: [] });

    expect(await toOrganize(api)).toEqual([]);
  });

  it('is undone for the Source untagged Notes are moved into (#36, scenario 3)', async () => {
    const api = await scholar();
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, kadi, pages(1, 3), ['kadı']);
    await api.organize.finish({ sourceId: kadi });
    t.passTime(hour);
    // Capture was still on Vakıf: two Notes went there by mistake.
    const wrong = await capture(api, vakif, ['s. 88', 's. 89']);
    t.passTime(hour);

    for (const id of wrong) await api.notes.move({ id, sourceId: kadi });

    expect(await toOrganize(api)).toEqual([{ title: 'Taşrada Kadı ve Naib', untaggedCount: 2 }]);
    expect([...(await api.organize.source({ sourceId: kadi })).newNoteIds].sort()).toEqual([...wrong].sort());
  });

  it('comes back with the Source when Kaynağı sil is taken back (Geri al)', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(api, kadi, ['s. 1']);
    await api.organize.finish({ sourceId: kadi });
    const finished = await api.organize.source({ sourceId: kadi });
    t.passTime(hour);
    const [fresh] = await capture(api, kadi, ['s. 2']);

    const { undoToken } = await api.sources.delete({ id: kadi });
    expect(await toOrganize(api)).toEqual([]);
    await api.undo({ token: undoToken! });

    expect(await api.organize.source({ sourceId: kadi })).toEqual({
      lastFinishedAt: finished.lastFinishedAt,
      untaggedCount: 1,
      newNoteIds: [fresh],
    });
  });

  it("cannot reach another Library's Source", async () => {
    const mine = await scholar();
    const theirs = await scholar();
    const { id } = await theirs.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    await capture(theirs, id, ['s. 1']);

    await expect(mine.organize.finish({ sourceId: id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(mine.organize.source({ sourceId: id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await toOrganize(theirs)).toEqual([{ title: 'Taşrada Kadı ve Naib', untaggedCount: 1 }]);
    expect(await toOrganize(mine)).toEqual([]);
  });
});

describe('Toplu etiket', () => {
  it('puts the Tags on every selected Note, and Geri al takes off only the links it put on (#13, scenario 1)', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const [already] = await capture(api, kadi, ['s. 40'], ['vekâlet']);
    const rest = await capture(api, kadi, pages(41, 52));
    const before = await api.notes.list({ sourceId: kadi });

    const { undoToken } = await api.organize.tag({ noteIds: [already!, ...rest], names: ['Vekâlet', 'naib'] });

    const tagged = await api.notes.list({ sourceId: kadi });
    expect(tagged.map((n) => n.tags.map((tag) => tag.name))).toEqual(tagged.map(() => ['naib', 'vekâlet']));
    expect(await toOrganize(api)).toEqual([]);

    await api.undo({ token: undoToken! });

    expect(await api.notes.list({ sourceId: kadi })).toEqual(before);
    // "naib" was made by the bulk tag, and nothing carries it any more.
    expect((await api.tags.list({ sort: 'name' })).map((tag) => tag.name)).toEqual(['vekâlet']);
  });

  it("offers no Geri al when it adds nothing, and skips another Library's Notes", async () => {
    const api = await scholar();
    const theirs = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: other } = await theirs.sources.create({ type: 'book', title: 'Başka' });
    const [mine] = await capture(api, kadi, ['s. 1'], ['kadı']);
    const [notMine] = await capture(theirs, other, ['s. 1']);

    expect(await api.organize.tag({ noteIds: [mine!], names: ['Kadı'] })).toEqual({ undoToken: null });
    expect(await api.organize.tag({ noteIds: [notMine!], names: ['naib'] })).toEqual({ undoToken: null });

    expect((await theirs.notes.get({ id: notMine! })).tags).toEqual([]);
    expect((await api.tags.list({ sort: 'name' })).map((tag) => tag.name)).toEqual(['kadı']);
  });
});
