import { uuidv7 } from 'uuidv7';
import { beforeAll, describe, expect, it } from 'vitest';

import { NOTE_PAGE } from './routers/search';
import { scholarEmail, testApi } from './test/harness';
import { scenarioLibrary, scenarios } from './test/search-scenarios';

const t = testApi();

let scenario: Awaited<ReturnType<typeof scenarioLibrary>>;

beforeAll(async () => {
  scenario = await scenarioLibrary(t);
});

async function noteMatch(query: string, text: string) {
  const found = await scenario.api.search.library({ query });
  return found.notes.find((n) => n.id === scenario.notes.get(text)?.id)?.match ?? null;
}

async function sourceMatch(query: string, title: string) {
  const found = await scenario.api.search.library({ query });
  return found.sources.find((s) => s.id === scenario.sources.get(title))?.match ?? null;
}

/** Where a Note comes in the results, from 0. */
async function rank(query: string, text: string) {
  const found = await scenario.api.search.library({ query });
  return found.notes.findIndex((n) => n.id === scenario.notes.get(text)?.id);
}

// The contract's ordering rules: the first Note comes before the second.
const orderings: [nr: string, query: string, first: string, second: string, rule: string][] = [
  ['S1', 'kır', 'kır kahvesi', 'kir içinde', 'within exact, the exact spelling first'],
  ['S2', 'kadı', 'Kadı hükmü verdi', 'kadılar toplandı', 'exact before stem'],
  ['S3', 'kadı', 'Kadının hükmü', 'kadılar toplandı', 'within a tier, the newer Note first'],
  ['S4', 'kadı', 'kadılar toplandı', 'kadîm gelenek', 'stem before prefix'],
  ['S5', 'kitap', 'Kitâb-ı ḳadîm', 'kitapları okudu', 'exact before stem'],
];

describe('Library search, the scenario table', () => {
  it.each(scenarios)('%s: %s → %s %s', async (_nr, query, kind, target, match) => {
    const found = kind === 'note' ? await noteMatch(query, target) : await sourceMatch(query, target);
    expect(found).toBe(match);
  });

  it.each(orderings)('%s: %s puts %s before %s (%s)', async (_nr, query, first, second) => {
    const a = await rank(query, first);
    const b = await rank(query, second);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(b).toBeGreaterThan(a);
  });
});

describe('A Note result', () => {
  it('shows the matching words marked, with its Source and Locator', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id: sourceId } = await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      author: 'Halil İnalcık',
    });
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: 's. 45', excerpt: 'Kadılar, naiplerini kendileri seçerdi.' });

    const { notes } = await api.search.library({ query: 'kadı naib' });

    expect(notes).toEqual([
      {
        id,
        sourceId,
        title: 'Taşrada Kadı ve Naib',
        author: 'Halil İnalcık',
        locator: 's. 45',
        match: 'stem',
        fromComment: false,
        snippet: [
          { text: 'Kadılar', hit: true },
          { text: ', ', hit: false },
          { text: 'naiplerini', hit: true },
          { text: ' kendileri seçerdi.', hit: false },
        ],
      },
    ]);
  });

  it('says the part comes from the Comment when only the Comment matched', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Tezâkir' });
    await api.notes.create({
      id: uuidv7(),
      sourceId,
      excerpt: 'Meclis-i Vâlâ toplandı.',
      comment: 'Vakıf meselesi burada da var.',
    });

    const [result] = (await api.search.library({ query: 'vakıf' })).notes;

    expect(result?.fromComment).toBe(true);
    expect(result?.snippet).toEqual([
      { text: 'Vakıf', hit: true },
      { text: ' meselesi burada da var.', hit: false },
    ]);
  });

  it('keeps to the part of a long Excerpt around the first match', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Tezâkir' });
    const before = 'Bu sene içinde Dersaadet’te pek çok mesele görüşüldü ve meclislerde uzun uzadıya konuşuldu; ';
    const after =
      ' hakkında verilen karar ise taşraya ancak aylar sonra ulaşabildi ve uygulanması da yıllar sürdü. '.repeat(4);
    await api.notes.create({ id: uuidv7(), sourceId, excerpt: `${before}evkaf${after}` });

    const [result] = (await api.search.library({ query: 'evkaf' })).notes;
    const text = result?.snippet.map((s) => s.text).join('') ?? '';

    expect(result?.snippet.filter((s) => s.hit)).toEqual([{ text: 'evkaf', hit: true }]);
    expect(text.startsWith('…')).toBe(true);
    expect(text.endsWith('…')).toBe(true);
    expect(text.length).toBeLessThan(260);
  });
});

describe('Library search', () => {
  it("never returns another Account's Notes or Sources", async () => {
    const kadi = await (await t.signIn(scholarEmail('kadi'))).call();
    const naib = await (await t.signIn(scholarEmail('naib'))).call();
    const { id: sourceId } = await kadi.sources.create({ type: 'book', title: 'Kadı sicilleri' });
    await kadi.notes.create({ id: uuidv7(), sourceId, excerpt: 'Kadı hükmü verdi.' });

    expect(await naib.search.library({ query: 'kadı' })).toEqual({
      sources: [],
      notes: [],
      noteTotal: 0,
      nextCursor: null,
      hiddenUndated: { sources: 0, notes: 0 },
    });
    expect(await naib.search.library({ query: '"kadı hükmü"' })).toEqual({
      sources: [],
      notes: [],
      noteTotal: 0,
      nextCursor: null,
      hiddenUndated: { sources: 0, notes: 0 },
    });
    expect((await kadi.search.library({ query: 'kadı' })).noteTotal).toBe(1);
  });

  it('finds a Note as soon as it is captured, and by its new words once edited', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Tezâkir' });
    const id = uuidv7();

    await api.notes.create({ id, sourceId, excerpt: 'Meclis toplandı.' });
    expect((await api.search.library({ query: 'meclis' })).notes.map((n) => n.id)).toEqual([id]);

    await api.notes.update({ id, excerpt: 'Divan toplandı.' });
    expect((await api.search.library({ query: 'meclis' })).notes).toEqual([]);
    expect((await api.search.library({ query: 'divan' })).notes.map((n) => n.id)).toEqual([id]);
  });

  it('searches Başlık, Yazar, Künye notu and the type-specific fields of a Source, not its identifiers', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id } = await api.sources.create({
      type: 'book',
      title: 'Kanunnâmeler',
      author: 'Ömer Lütfi Barkan',
      isbn: '9789751600000',
      bibliographicNote: 'Çeviren: Nurettin Arı',
      fields: { publisher: 'Türk Tarih Kurumu', placeOfPublication: 'Ankara' },
    });

    const found = async (query: string) => (await api.search.library({ query })).sources.map((s) => s.id);
    expect(await found('barkan')).toEqual([id]);
    expect(await found('nurettin')).toEqual([id]);
    expect(await found('kurumu ankara')).toEqual([id]);
    expect(await found('9789751600000')).toEqual([]);
  });

  it('returns nothing for a query with no word to look for', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Kadı sicilleri' });
    await api.notes.create({ id: uuidv7(), sourceId, excerpt: 'Kadı hükmü verdi.' });

    const nothing = { sources: [], notes: [], noteTotal: 0, nextCursor: null, hiddenUndated: { sources: 0, notes: 0 } };
    for (const query of ['', '   ', '-kadın', '""', '…, ;']) {
      expect(await api.search.library({ query })).toEqual(nothing);
    }
  });

  it('pages through every matching Note, best first', async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Kadı sicilleri' });
    const ids: string[] = [];
    for (let i = 0; i < NOTE_PAGE + 5; i++) {
      const id = uuidv7();
      await api.notes.create({ id, sourceId, excerpt: `Kadı hükmü ${i}` });
      ids.push(id);
    }

    const first = await api.search.library({ query: 'kadı' });
    const second = await api.search.library({ query: 'kadı', cursor: first.nextCursor });

    expect(first.noteTotal).toBe(NOTE_PAGE + 5);
    expect(first.notes).toHaveLength(NOTE_PAGE);
    expect(second.nextCursor).toBeNull();
    // Newest first within one tier, and no Note twice.
    expect([...first.notes, ...second.notes].map((n) => n.id)).toEqual(ids.reverse());
  });
});
