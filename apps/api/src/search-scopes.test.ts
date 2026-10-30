import { uuidv7 } from 'uuidv7';
import { beforeAll, describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';
import { SCENARIO_TAG, scenarioLibrary, scenarios } from './test/search-scenarios';

const t = testApi();

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}

let scenario: Awaited<ReturnType<typeof scenarioLibrary>>;
/** A Collection of the scenario Library's Tag, so it holds every scenario Note; and that Tag. */
let collectionId: string;
let tagId: string;

beforeAll(async () => {
  scenario = await scenarioLibrary(t);
  ({ id: collectionId } = await scenario.api.collections.create({ name: 'Arama', tags: [SCENARIO_TAG] }));
  tagId = (await scenario.api.tags.list({ sort: 'name' })).find((tag) => tag.name === SCENARIO_TAG)!.id;
});

const noteRows = scenarios.filter(([, , kind]) => kind === 'note');

/** How a scope's results found the scenario Note, or null when they did not. */
function matchOf(found: { notes: { id: string; match: string }[] }, text: string) {
  return found.notes.find((n) => n.id === scenario.notes.get(text)?.id)?.match ?? null;
}

// "Bu kaynakta ara" and the search box of a Collection or a Tag's page work
// by the Library search's rules (#40, story 156): the scenario table again.
describe('The scenario table in every scope', () => {
  it.each(noteRows)('%s: %s → %s %s, in its Source', async (_nr, query, _kind, target, match) => {
    const sourceId = scenario.notes.get(target)!.sourceId;
    expect(matchOf(await scenario.api.search.source({ sourceId, query }), target)).toBe(match);
  });

  it.each(noteRows)('%s: %s → %s %s, in a Collection', async (_nr, query, _kind, target, match) => {
    expect(matchOf(await scenario.api.search.collection({ id: collectionId, query }), target)).toBe(match);
  });

  it.each(noteRows)("%s: %s → %s %s, on a Tag's page", async (_nr, query, _kind, target, match) => {
    const found = await scenario.api.search.tag({ tagId, includeSourceNotes: true, query });
    expect(matchOf(found, target)).toBe(match);
  });
});

describe('Searching a Collection or a Tag page', () => {
  it('finds only the Notes its view shows, by their own Tag or, with the switch on, their Source’s', async () => {
    const api = await scholar();
    const { id: selanik } = await api.sources.create({ type: 'book', title: 'Selanik şubesi' });
    const { id: paris } = await api.sources.create({ type: 'book', title: 'Paris kongresi' });
    await api.tags.setOnSource({ sourceId: selanik, names: ['İttihat ve Terakki'] });
    const own = uuidv7();
    const viaSource = uuidv7();
    await api.notes.create({ id: own, sourceId: paris, excerpt: 'Cemiyet kongresi.', tags: ['İttihat ve Terakki'] });
    await api.notes.create({ id: viaSource, sourceId: selanik, excerpt: 'Cemiyetin Selanik merkezi.' });
    await api.notes.create({ id: uuidv7(), sourceId: paris, excerpt: 'Cemiyet dışı bir not.', tags: ['Jön Türkler'] });
    const { id } = await api.collections.create({ name: 'İttihat ve Terakki', tags: ['İttihat ve Terakki'] });
    const tag = (await api.tags.list({ sort: 'name' })).find((t) => t.name === 'İttihat ve Terakki')!;
    const ids = (found: { notes: { id: string }[] }) => found.notes.map((n) => n.id).sort();

    expect(ids(await api.search.collection({ id, query: 'cemiyet' }))).toEqual([own, viaSource].sort());
    expect(ids(await api.search.tag({ tagId: tag.id, includeSourceNotes: true, query: 'cemiyet' }))).toEqual(
      [own, viaSource].sort(),
    );
    expect(ids(await api.search.tag({ tagId: tag.id, includeSourceNotes: false, query: 'cemiyet' }))).toEqual([own]);
    await api.collections.setIncludeSourceNotes({ id, includeSourceNotes: false });
    expect(ids(await api.search.collection({ id, query: 'cemiyet' }))).toEqual([own]);
  });

  it("finds nothing in another Account's Collection or Tag", async () => {
    const kadi = await scholar();
    const naib = await scholar();
    const { id: sourceId } = await kadi.sources.create({ type: 'book', title: 'Kadı sicilleri' });
    await kadi.notes.create({ id: uuidv7(), sourceId, excerpt: 'Kadı hükmü verdi.', tags: ['kadı'] });
    const { id } = await kadi.collections.create({ name: 'Kadılar', tags: ['kadı'] });
    const [tag] = await kadi.tags.list({ sort: 'name' });

    await expect(naib.search.collection({ id, query: 'kadı' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(naib.search.tag({ tagId: tag!.id, includeSourceNotes: true, query: 'kadı' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('Bu kaynakta ara', () => {
  it("finds only the Source's own Notes, with every matching word marked in the whole text", async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: otherId } = await api.sources.create({ type: 'archive', title: 'BOA, DH.MKT' });
    const id = uuidv7();
    await api.notes.create({
      id,
      sourceId,
      locator: 's. 45',
      excerpt: 'Kadılar, naiplerini kendileri seçerdi.',
      comment: 'Kadı ile naib ayrımı.',
    });
    await api.notes.create({ id: uuidv7(), sourceId, excerpt: 'Mahkeme defterleri.' });
    await api.notes.create({ id: uuidv7(), sourceId: otherId, excerpt: 'Kadı tayini.' });

    expect(await api.search.source({ sourceId, query: 'kadı' })).toEqual({
      notes: [
        {
          id,
          // The Comment has the word as it is.
          match: 'exact',
          excerpt: [
            { text: 'Kadılar', hit: true },
            { text: ', naiplerini kendileri seçerdi.', hit: false },
          ],
          comment: [
            { text: 'Kadı', hit: true },
            { text: ' ile naib ayrımı.', hit: false },
          ],
        },
      ],
    });
  });

  it("finds nothing in another Account's Source", async () => {
    const kadi = await scholar();
    const naib = await scholar();
    const { id: sourceId } = await kadi.sources.create({ type: 'book', title: 'Kadı sicilleri' });
    await kadi.notes.create({ id: uuidv7(), sourceId, excerpt: 'Kadı hükmü verdi.' });

    await expect(naib.search.source({ sourceId, query: 'kadı' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
