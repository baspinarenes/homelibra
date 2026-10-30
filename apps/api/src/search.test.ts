import { uuidv7 } from 'uuidv7';
import { beforeAll, describe, expect, it } from 'vitest';

import { type Match, NOTE_PAGE } from './routers/search';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

type Api = Awaited<ReturnType<Awaited<ReturnType<typeof t.signIn>>['call']>>;

let scenario: Api;
/** The scenario Library's Notes by their Excerpt (or Comment, when it has none), and its Sources by Başlık. */
const scenarioNotes = new Map<string, string>();
const scenarioSources = new Map<string, string>();

// The Library of the search contract's scenario table (#16, prototype of #28).
beforeAll(async () => {
  scenario = await (await t.signIn(scholarEmail())).call();
  const addSource = async (input: Parameters<Api['sources']['create']>[0]) => {
    const { id } = await scenario.sources.create(input);
    scenarioSources.set(input.title, id);
    return id;
  };
  const general = await addSource({ type: 'book', title: 'Genel not defteri' });
  await addSource({
    type: 'book',
    title: 'Osmanlı İmparatorluğu Klasik Çağ',
    author: 'Halil İnalcık',
    date: { calendar: 'gregorian', year: 1973 },
  });
  const tanzimat = await addSource({
    type: 'book',
    title: 'Tanzimat Fermanı',
    author: 'Mustafa Reşid Paşa',
    date: { calendar: 'gregorian', year: 1839 },
  });
  await addSource({
    type: 'archive',
    title: 'Defter-i Hâkânî',
    author: 'Başbakanlık Osmanlı Arşivi',
    date: { calendar: 'hijri', year: 1310 },
  });
  await addSource({ type: 'book', title: 'Mecelle', bibliographicNote: "1310 tarihli tab'" });

  // Captured in this order, so a later Note is a newer one.
  const captured: { excerpt?: string; comment?: string; sourceId?: string; locator?: string }[] = [
    { excerpt: 'IRAK vilayeti' },
    { excerpt: "İstanbul'da yangın" },
    { excerpt: 'ʿulemâ-yı kirâm' },
    { excerpt: 'ulemanın görüşü' },
    { excerpt: 'kitapları okudu' },
    { excerpt: 'Kitâb-ı ḳadîm' },
    { excerpt: "Sultan Mehmed'in fermanı" },
    { excerpt: 'Mehmet Paşa' },
    { excerpt: "te'lif eserler" },
    { excerpt: "şer'iyye sicili" },
    { excerpt: 'şerʿiyye sicili' },
    { excerpt: "Şeyhü'l-İslâm fetvası" },
    { excerpt: 'şeyhülislâm' },
    { excerpt: 'sancağı' },
    { excerpt: 'sancakbeyi' },
    { excerpt: 'vakfı' },
    { excerpt: 'vakıflar' },
    { excerpt: 'timar sistemi' },
    { excerpt: 'tımarlı sipahi' },
    { excerpt: 'mahkemesi' },
    { excerpt: 'kadılar toplandı' },
    { comment: 'Kadının hükmü' },
    { excerpt: 'kadın ve aile' },
    { excerpt: 'kadîm gelenek' },
    { excerpt: 'Kadı hükmü verdi' },
    { excerpt: 'kir içinde' },
    { excerpt: 'gitmişti' },
    { excerpt: 'Osmanlılar' },
    { excerpt: 'evkaf' },
    { excerpt: '29 Z 1310 tarihli' },
    { excerpt: "İnalcık'a göre" },
    { excerpt: "Gülhane'de okundu", sourceId: tanzimat },
    { excerpt: 'berat sureti', locator: 'vr. 12b' },
    { excerpt: 'kır kahvesi' },
    { excerpt: 'kitabı kadîm nüshası' },
  ];
  for (const { sourceId = general, ...text } of captured) {
    const id = uuidv7();
    await scenario.notes.create({ id, sourceId, ...text });
    scenarioNotes.set(text.excerpt ?? text.comment ?? '', id);
  }
});

async function noteMatch(query: string, text: string) {
  const found = await scenario.search.library({ query });
  return found.notes.find((n) => n.id === scenarioNotes.get(text))?.match ?? null;
}

async function sourceMatch(query: string, title: string) {
  const found = await scenario.search.library({ query });
  return found.sources.find((s) => s.id === scenarioSources.get(title))?.match ?? null;
}

/** Where a Note comes in the results, from 0. */
async function rank(query: string, text: string) {
  const found = await scenario.search.library({ query });
  return found.notes.findIndex((n) => n.id === scenarioNotes.get(text));
}

// The search contract's scenario table (#16): the query, the Note or Source it
// should or should not find, and how. Rows are the contract; change none here.
// Row 4 moved from prefix to stem by Enes's decision (ADR-0010). "E" rows check
// rules of the contract's text that the table has no row for.
const scenarios: [nr: string, query: string, kind: 'note' | 'source', target: string, match: Match | null][] = [
  ['1', 'ırak', 'note', 'IRAK vilayeti', 'exact'],
  ['2', 'istanbul', 'note', "İstanbul'da yangın", 'stem'],
  ['3', 'ulema', 'note', 'ʿulemâ-yı kirâm', 'exact'],
  ['4', 'ulema', 'note', 'ulemanın görüşü', 'stem'],
  ['5', 'kitabın', 'note', 'kitapları okudu', 'stem'],
  ['6', 'kitap', 'note', 'Kitâb-ı ḳadîm', 'exact'],
  ['7', 'Mehmet', 'note', "Sultan Mehmed'in fermanı", 'stem'],
  ['8', 'Mehmed', 'note', 'Mehmet Paşa', 'exact'],
  ['9', 'telif', 'note', "te'lif eserler", 'exact'],
  ['10a', 'şeriyye', 'note', "şer'iyye sicili", 'exact'],
  ['10b', 'şeriyye', 'note', 'şerʿiyye sicili', 'exact'],
  ['11', 'şeyhülislam', 'note', "Şeyhü'l-İslâm fetvası", 'exact'],
  ['12', `"şeyhü'l-islam"`, 'note', 'şeyhülislâm', 'exact'],
  ['13', 'sancak', 'note', 'sancağı', 'stem'],
  ['14', 'sancak', 'note', 'sancakbeyi', 'prefix'],
  ['15a', 'vakıf', 'note', 'vakfı', 'stem'],
  ['15b', 'vakıf', 'note', 'vakıflar', 'stem'],
  ['16', 'tımar', 'note', 'timar sistemi', 'exact'],
  ['17', 'tımar', 'note', 'tımarlı sipahi', 'prefix'],
  ['18', 'mahkeme', 'note', 'mahkemesi', 'prefix'],
  ['19a', 'kadı', 'note', 'kadılar toplandı', 'stem'],
  ['19b', 'kadı', 'note', 'Kadının hükmü', 'stem'],
  ['20a', 'kadı', 'note', 'kadın ve aile', 'prefix'],
  ['20b', 'kadı', 'note', 'kadîm gelenek', 'prefix'],
  ['21', '"kadı"', 'note', 'kadın ve aile', null],
  ['22', '"kadı"', 'note', 'Kadı hükmü verdi', 'exact'],
  ['23', 'kadı -kadın', 'note', 'kadın ve aile', null],
  ['24', 'kır', 'note', 'kir içinde', 'exact'],
  ['25', 'gitti', 'note', 'gitmişti', null],
  ['26', 'gitmiş', 'note', 'gitmişti', 'stem'],
  ['27', 'Osm', 'note', 'Osmanlılar', 'prefix'],
  ['28', 'ev', 'note', 'evkaf', null],
  ['29', '1310', 'note', '29 Z 1310 tarihli', 'exact'],
  ['30', 'nalcık', 'source', 'Osmanlı İmparatorluğu Klasik Çağ', 'part'],
  ['31', 'nalcık', 'note', "İnalcık'a göre", null],
  ['32a', 'tanzimat', 'source', 'Tanzimat Fermanı', 'exact'],
  ['32b', 'tanzimat', 'note', "Gülhane'de okundu", null],
  ['33', 'vr. 12b', 'note', 'berat sureti', null],
  ['34a', '1310', 'source', 'Defter-i Hâkânî', null],
  ['34b', '1310', 'source', 'Mecelle', 'exact'],
  ['E1', 'kadı -kadın', 'note', 'kadılar toplandı', 'stem'],
  ['E2', '"kitab-ı kadim"', 'note', 'Kitâb-ı ḳadîm', 'exact'],
  ['E3', '"kitab-ı kadim"', 'note', 'kitabı kadîm nüshası', 'exact'],
  ['E4', '"kitabı kadim"', 'note', 'Kitâb-ı ḳadîm', 'exact'],
  ['E5', '"verdi kadı"', 'note', 'Kadı hükmü verdi', null],
  ['E6', 'islam', 'note', "Şeyhü'l-İslâm fetvası", 'exact'],
  ['E7', 'hüküm', 'note', 'Kadının hükmü', 'stem'],
  ['E8', 'kadı hükmü', 'note', 'Kadının hükmü', 'stem'],
  ['E9', "şeyhü'l-islam", 'note', 'şeyhülislâm', 'exact'],
];

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
    });
    expect(await naib.search.library({ query: '"kadı hükmü"' })).toEqual({
      sources: [],
      notes: [],
      noteTotal: 0,
      nextCursor: null,
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

    const nothing = { sources: [], notes: [], noteTotal: 0, nextCursor: null };
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
