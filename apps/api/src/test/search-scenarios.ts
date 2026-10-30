import { uuidv7 } from 'uuidv7';

import type { Match } from '../routers/search';
import { scholarEmail, type testApi } from './harness';

type Api = Awaited<ReturnType<Awaited<ReturnType<ReturnType<typeof testApi>['signIn']>>['call']>>;

/** The Tag every Note of the scenario Library carries, so a Collection or a Tag page holds them all. */
export const SCENARIO_TAG = 'Arama senaryosu';

/**
 * The Library of the search contract's scenario table (#16, prototype of
 * #28), in a new Account: its Notes by their Excerpt (or Comment, when it
 * has none) with their Source, and its Sources by Başlık.
 */
export async function scenarioLibrary(t: ReturnType<typeof testApi>) {
  const api: Api = await (await t.signIn(scholarEmail())).call();
  const notes = new Map<string, { id: string; sourceId: string }>();
  const sources = new Map<string, string>();
  const addSource = async (input: Parameters<Api['sources']['create']>[0]) => {
    const { id } = await api.sources.create(input);
    sources.set(input.title, id);
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
    await api.notes.create({ id, sourceId, ...text, tags: [SCENARIO_TAG] });
    notes.set(text.excerpt ?? text.comment ?? '', { id, sourceId });
  }
  return { api, notes, sources };
}

// The search contract's scenario table (#16): the query, the Note or Source it
// should or should not find, and how. Rows are the contract; change none here.
// Row 4 moved from prefix to stem by Enes's decision (ADR-0010). "E" rows check
// rules of the contract's text that the table has no row for.
export const scenarios: [nr: string, query: string, kind: 'note' | 'source', target: string, match: Match | null][] = [
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
