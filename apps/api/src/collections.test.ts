import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}
type Api = Awaited<ReturnType<typeof scholar>>;

/** Captures a Note and returns its id. */
async function capture(
  api: Api,
  sourceId: string,
  note: { locator?: string; excerpt?: string; comment?: string; tags?: string[] },
) {
  const id = uuidv7();
  await api.notes.create({ id, sourceId, ...note, excerpt: note.excerpt ?? (note.comment ? undefined : 'Alıntı.') });
  return id;
}

const names = (tags: { name: string }[]) => tags.map((tag) => tag.name);

/** The view's Notes in order, by their Excerpt or Comment. */
const texts = (view: { groups: { notes: { excerpt: string | null; comment: string | null }[] }[] }) =>
  view.groups.flatMap((group) => group.notes.map((note) => note.excerpt ?? note.comment));

describe('Collection membership (#3)', () => {
  it('leaves out a Note that carries only a Tag the Collection does not have (scenario 1)', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Enver Paşa' });
    await capture(api, sourceId, { excerpt: 'Enver Bey Selanik’te.', tags: ['Enver Paşa'] });
    await capture(api, sourceId, { excerpt: 'Cemiyet kuruldu.', tags: ['İttihat ve Terakki'] });

    const { id } = await api.collections.create({ name: 'İttihat ve Terakki', tags: ['ittihat ve terakki'] });

    expect(texts(await api.collections.view({ id }))).toEqual(['Cemiyet kuruldu.']);
  });

  it('takes every Note of a tagged Source while the switch is on, only the tagged ones when off (scenario 2)', async () => {
    const api = await scholar();
    const { id: fond } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'DH.MKT' });
    await api.tags.setOnSource({ sourceId: fond, names: ['Ermeni meselesi'] });
    await capture(api, fond, { locator: '1234/56', excerpt: 'Tahrirat.' });
    await capture(api, fond, { locator: '1235/1', excerpt: 'Telgraf.', tags: ['Ermeni meselesi'] });
    await capture(api, fond, { locator: '1236/2', excerpt: 'Arzuhal.' });
    const { id } = await api.collections.create({ name: 'Ermeni meselesi', tags: ['Ermeni meselesi'] });

    const on = await api.collections.view({ id });
    await api.collections.setIncludeSourceNotes({ id, includeSourceNotes: false });
    const off = await api.collections.view({ id });

    expect(on.includeSourceNotes).toBe(true);
    expect(texts(on)).toEqual(['Tahrirat.', 'Telgraf.', 'Arzuhal.']);
    expect(off.includeSourceNotes).toBe(false);
    expect(texts(off)).toEqual(['Telgraf.']);
  });

  it('shows a Note that both it and its Source carry a Tag of once (scenario 3)', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'periodical', title: 'Tanin' });
    await api.tags.setOnSource({ sourceId, names: ['basın'] });
    await capture(api, sourceId, { excerpt: 'Gazete kapatıldı.', tags: ['basın'] });
    const { id } = await api.collections.create({ name: 'Basın', tags: ['basın'] });

    const view = await api.collections.view({ id });

    expect(texts(view)).toEqual(['Gazete kapatıldı.']);
    expect(view).toMatchObject({ noteCount: 1, sourceCount: 1 });
  });

  it('lets go of a Source’s Notes without a trace once its Tag comes off (scenario 4)', async () => {
    const api = await scholar();
    const { id: book } = await api.sources.create({ type: 'book', title: 'Osmanlı Tarihi' });
    await api.tags.setOnSource({ sourceId: book, names: ['Selanik'] });
    const noteId = await capture(api, book, { locator: 's. 3', excerpt: 'Genel bir giriş.' });
    const { id } = await api.collections.create({ name: 'Selanik', tags: ['Selanik'] });
    expect(texts(await api.collections.view({ id }))).toEqual(['Genel bir giriş.']);

    await api.tags.setOnSource({ sourceId: book, names: [] });

    expect(texts(await api.collections.view({ id }))).toEqual([]);
    expect((await api.notes.get({ id: noteId })).tags).toEqual([]);
  });

  it('takes only the Notes of the Source that carries the Tag, not of its neighbours', async () => {
    const api = await scholar();
    const { id: tagged } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'DH.MKT' });
    const { id: untagged } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'Y.PRK.ASK' });
    await api.tags.setOnSource({ sourceId: tagged, names: ['Ermeni meselesi'] });
    await capture(api, tagged, { excerpt: 'Tahrirat.' });
    await capture(api, untagged, { excerpt: 'Telgraf.' });
    const { id } = await api.collections.create({ name: 'Ermeni meselesi', tags: ['Ermeni meselesi'] });

    const view = await api.collections.view({ id });

    expect(texts(view)).toEqual(['Tahrirat.']);
    expect(view.sourceOnlyCount).toBe(1);
    expect((await api.collections.list())[0]?.noteCount).toBe(1);
  });

  it('is a Collection’s Tags in any of them: one Note per Tag it carries is enough', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Jön Türkler' });
    await capture(api, sourceId, { locator: 's. 1', excerpt: 'Paris kongresi.', tags: ['Jön Türkler'] });
    await capture(api, sourceId, { locator: 's. 2', excerpt: 'Selanik şubesi.', tags: ['İttihat ve Terakki'] });
    await capture(api, sourceId, { locator: 's. 3', excerpt: 'Kadılık.', tags: ['kadı'] });

    const { id } = await api.collections.create({ name: 'Meşrutiyet', tags: ['Jön Türkler', 'İttihat ve Terakki'] });

    expect(texts(await api.collections.view({ id }))).toEqual(['Paris kongresi.', 'Selanik şubesi.']);
  });
});

describe('The order of a view (#3)', () => {
  it('puts Sources by Date across calendars, then Yazar, then Başlık in Turkish order; undated last', async () => {
    const api = await scholar();
    const sources: Parameters<Api['sources']['create']>[0][] = [
      { type: 'book', title: 'Tarihsiz, yazarsız' },
      { type: 'book', author: 'Çelebi', title: 'Bir', date: { calendar: 'gregorian', year: 1910 } },
      { type: 'archive', author: 'BOA', title: 'Y.PRK.ASK', date: { calendar: 'rumi', year: 1324 } },
      { type: 'book', author: 'Zeki', title: 'Tarihsiz' },
      { type: 'book', author: 'Cemal', title: 'İkinci', date: { calendar: 'gregorian', year: 1910 } },
      { type: 'book', author: 'Cemal', title: 'Birinci', date: { calendar: 'gregorian', year: 1910 } },
      { type: 'periodical', title: 'Tanin', date: { calendar: 'gregorian', year: 1908 } },
      { type: 'archive', author: 'BOA', title: 'DH.MKT', date: { calendar: 'hijri', year: 1325 } },
      { type: 'book', author: 'Ahmed', title: 'Tarihsiz' },
    ];
    for (const input of sources) {
      const { id: sourceId } = await api.sources.create(input);
      await capture(api, sourceId, { excerpt: input.title, tags: ['Meşrutiyet'] });
    }
    const { id } = await api.collections.create({ name: 'Meşrutiyet', tags: ['Meşrutiyet'] });

    const view = await api.collections.view({ id });

    expect(view.groups.map(({ source }) => [source.author, source.title])).toEqual([
      ['BOA', 'DH.MKT'], // 1325 h. began in 1907
      [null, 'Tanin'], // 1908
      ['BOA', 'Y.PRK.ASK'], // 1324 r. began in March 1908
      ['Cemal', 'Birinci'],
      ['Cemal', 'İkinci'],
      ['Çelebi', 'Bir'],
      ['Ahmed', 'Tarihsiz'],
      ['Zeki', 'Tarihsiz'],
      [null, 'Tarihsiz, yazarsız'],
    ]);
    expect(view.groups[0]?.source.date).toEqual({ calendar: 'hijri', year: 1325 });
  });

  it('keeps a Source’s Notes in Locator order, as the Source page does (#81)', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Kadı Sicilleri' });
    await capture(api, sourceId, { locator: 's. 12', excerpt: 'On iki.', tags: ['kadı'] });
    await capture(api, sourceId, { locator: 'önsöz', excerpt: 'Önsöz.', tags: ['kadı'] });
    await capture(api, sourceId, { locator: 's. 2', excerpt: 'İki.', tags: ['kadı'] });
    await capture(api, sourceId, { comment: 'Eserin bütünü.', tags: ['kadı'] });
    const { id } = await api.collections.create({ name: 'Kadılar', tags: ['kadı'] });

    const [group] = (await api.collections.view({ id })).groups;

    // Konumsuz (the whole work) first, then a Locator with no number, then by number.
    expect(group?.notes.map((note) => note.locator)).toEqual([null, 'önsöz', 's. 2', 's. 12']);
  });
});

describe('Why a Note is here, and "+N not"', () => {
  it('names the Note’s own matching Tags, or the Source’s when only it brought the Note', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Selanik' });
    await api.tags.setOnSource({ sourceId, names: ['Selanik', 'liman'] });
    await capture(api, sourceId, { locator: 's. 1', excerpt: 'Liman açıldı.' });
    await capture(api, sourceId, {
      locator: 's. 2',
      excerpt: 'Cemiyet toplandı.',
      tags: ['Cemiyet', 'Selanik', 'kadı'],
    });
    const { id } = await api.collections.create({ name: 'Selanik', tags: ['Selanik', 'Cemiyet', 'liman'] });

    const [group] = (await api.collections.view({ id })).groups;

    expect(group?.notes.map((note) => note.why)).toEqual([
      {
        via: 'source',
        tags: [
          { id: expect.any(String), name: 'liman' },
          { id: expect.any(String), name: 'Selanik' },
        ],
      },
      {
        via: 'note',
        tags: [
          { id: expect.any(String), name: 'Cemiyet' },
          { id: expect.any(String), name: 'Selanik' },
        ],
      },
    ]);
  });

  it('counts the Notes only a Source’s Tag brings: in the view when on, what would come when off', async () => {
    const api = await scholar();
    const { id: fond } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'Y.PRK.ASK' });
    await api.tags.setOnSource({ sourceId: fond, names: ['ordu'] });
    for (const excerpt of ['Bir.', 'İki.', 'Üç.']) await capture(api, fond, { excerpt });
    await capture(api, fond, { excerpt: 'Dört.', tags: ['ordu'] });
    const { id: other } = await api.sources.create({ type: 'book', title: 'Ordu ve Siyaset' });
    await capture(api, other, { excerpt: 'Beş.', tags: ['ordu'] });
    const { id } = await api.collections.create({ name: 'Ordu', tags: ['ordu'] });

    const on = await api.collections.view({ id });
    await api.collections.setIncludeSourceNotes({ id, includeSourceNotes: false });
    const off = await api.collections.view({ id });

    expect(on).toMatchObject({ noteCount: 5, sourceCount: 2, sourceOnlyCount: 3 });
    expect(off).toMatchObject({ noteCount: 2, sourceCount: 2, sourceOnlyCount: 3 });
  });
});

describe('A Collection’s definition', () => {
  it('changes from the view: Tags added and taken away, the name, all kept', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Jön Türkler' });
    await capture(api, sourceId, { locator: 's. 1', excerpt: 'Paris kongresi.', tags: ['Jön Türkler'] });
    await capture(api, sourceId, { locator: 's. 2', excerpt: 'Selanik şubesi.', tags: ['Cemiyet'] });
    const { id } = await api.collections.create({ name: 'Taslak', tags: ['Jön Türkler'] });

    await api.collections.setTags({ id, names: ['cemiyet', 'Enver Paşa'] });
    await api.collections.rename({ id, name: '  İttihat ve Terakki ' });

    const view = await api.collections.view({ id });
    expect(view.name).toBe('İttihat ve Terakki');
    expect(names(view.tags)).toEqual(['Cemiyet', 'Enver Paşa']);
    expect(texts(view)).toEqual(['Selanik şubesi.']);
  });

  it('with no Tags left stays, empty', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Jön Türkler' });
    await capture(api, sourceId, { excerpt: 'Paris kongresi.', tags: ['Jön Türkler'] });
    const { id } = await api.collections.create({ name: 'Jön Türkler', tags: ['Jön Türkler'] });

    await api.collections.setTags({ id, names: [] });

    expect(await api.collections.view({ id })).toMatchObject({
      name: 'Jön Türkler',
      tags: [],
      groups: [],
      noteCount: 0,
      sourceCount: 0,
      sourceOnlyCount: 0,
    });
  });

  it('keeps a Tag alive that nothing else uses, and lets it go with its last use', async () => {
    const api = await scholar();
    const { id } = await api.collections.create({ name: 'Plan', tags: ['ileride'] });
    expect(names(await api.tags.list({ sort: 'name' }))).toEqual(['ileride']);

    await api.collections.setTags({ id, names: [] });

    expect(await api.tags.list({ sort: 'name' })).toEqual([]);
  });

  it('uses a Tag: one put into it counts as last used on Ana sayfa', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Kadılık' });
    await capture(api, sourceId, { excerpt: 'Kadı azli.', tags: ['kadı'] });

    await api.collections.create({ name: 'Plan', tags: ['vakıf'] });

    expect(names(await api.tags.list({ sort: 'recent' }))).toEqual(['vakıf', 'kadı']);
  });

  it('outlives the last Note carrying its Tag: the Tag stays in the definition', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Jön Türkler' });
    const noteId = await capture(api, sourceId, { excerpt: 'Paris kongresi.', tags: ['Jön Türkler'] });
    const { id } = await api.collections.create({ name: 'Jön Türkler', tags: ['Jön Türkler'] });

    await api.notes.delete({ id: noteId });

    expect(names((await api.collections.view({ id })).tags)).toEqual(['Jön Türkler']);
  });

  it('is only its own Library’s', async () => {
    const mine = await scholar();
    const theirs = await scholar();
    const { id } = await mine.collections.create({ name: 'Dosyam', tags: ['kadı'] });

    await expect(theirs.collections.view({ id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(theirs.collections.rename({ id, name: 'Benim' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(theirs.collections.setTags({ id, names: [] })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await theirs.collections.list()).toEqual([]);
    expect((await mine.collections.view({ id })).name).toBe('Dosyam');
  });
});

describe('Dosyalar', () => {
  it('lists every Collection A–Z with its Tags and how many Notes it shows now', async () => {
    const api = await scholar();
    const { id: fond } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'DH.MKT' });
    await api.tags.setOnSource({ sourceId: fond, names: ['Ermeni meselesi'] });
    await capture(api, fond, { excerpt: 'Tahrirat.' });
    await capture(api, fond, { excerpt: 'Telgraf.', tags: ['basın'] });
    const { id: closed } = await api.collections.create({
      name: 'Ermeni meselesi (yalnız etiketli)',
      tags: ['Ermeni meselesi'],
      includeSourceNotes: false,
    });
    await api.collections.create({ name: 'Basın ve Ermeni meselesi', tags: ['Ermeni meselesi', 'basın'] });
    await api.collections.create({ name: 'Çalışma', tags: [] });

    expect(await api.collections.list()).toEqual([
      {
        id: expect.any(String),
        name: 'Basın ve Ermeni meselesi',
        tags: [
          { id: expect.any(String), name: 'basın' },
          { id: expect.any(String), name: 'Ermeni meselesi' },
        ],
        noteCount: 2,
      },
      { id: expect.any(String), name: 'Çalışma', tags: [], noteCount: 0 },
      {
        id: closed,
        name: 'Ermeni meselesi (yalnız etiketli)',
        tags: [{ id: expect.any(String), name: 'Ermeni meselesi' }],
        noteCount: 0,
      },
    ]);
  });
});

describe('A Tag’s page', () => {
  it('is the view of that one Tag, unsaved, with the switch as the scholar sets it there', async () => {
    const api = await scholar();
    const { id: fond } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'DH.MKT' });
    await api.tags.setOnSource({ sourceId: fond, names: ['kadı'] });
    await capture(api, fond, { locator: '1/1', excerpt: 'Kadı azli.' });
    await capture(api, fond, { locator: '1/2', excerpt: 'Naib tayini.', tags: ['kadı', 'naib'] });
    const [kadi] = await api.tags.list({ sort: 'name' });

    const on = await api.collections.tagView({ tagId: kadi!.id, includeSourceNotes: true });
    const off = await api.collections.tagView({ tagId: kadi!.id, includeSourceNotes: false });

    expect(on).toMatchObject({ tag: { id: kadi!.id, name: 'kadı' }, noteCount: 2, sourceCount: 1, sourceOnlyCount: 1 });
    expect(texts(on)).toEqual(['Kadı azli.', 'Naib tayini.']);
    expect(texts(off)).toEqual(['Naib tayini.']);
    expect(await api.collections.list()).toEqual([]);
  });

  it('is saved as a Collection with the same name and Tag (Dosya olarak kaydet)', async () => {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Kadılık' });
    await capture(api, sourceId, { excerpt: 'Kadı azli.', tags: ['kadı'] });
    const [kadi] = await api.tags.list({ sort: 'name' });

    const { id } = await api.collections.create({ name: kadi!.name, tags: [kadi!.name] });

    expect(await api.collections.view({ id })).toMatchObject({
      name: 'kadı',
      tags: [{ id: kadi!.id, name: 'kadı' }],
      includeSourceNotes: true,
      noteCount: 1,
    });
  });

  it('of another Library’s Tag is not found', async () => {
    const mine = await scholar();
    const theirs = await scholar();
    const { id: sourceId } = await mine.sources.create({ type: 'book', title: 'Kadılık' });
    await capture(mine, sourceId, { excerpt: 'Kadı azli.', tags: ['kadı'] });
    const [kadi] = await mine.tags.list({ sort: 'name' });

    await expect(theirs.collections.tagView({ tagId: kadi!.id, includeSourceNotes: true })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

describe('Tag merge and Tag sil reach Collections (#3, #36)', () => {
  /** Two Collections using "Cemiyet", one of them "İttihat ve Terakki" too. */
  async function cemiyetInCollections() {
    const api = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Jön Türkler' });
    await capture(api, sourceId, { excerpt: 'Selanik şubesi.', tags: ['Cemiyet'] });
    const { id: draft } = await api.collections.create({ name: 'Taslak', tags: ['Cemiyet'] });
    const { id: article } = await api.collections.create({
      name: 'Makale',
      tags: ['Cemiyet', 'İttihat ve Terakki'],
    });
    const tags = await api.tags.list({ sort: 'name' });
    const tagNamed = (name: string) => tags.find((tag) => tag.name === name)!;
    return { api, draft, article, cemiyet: tagNamed('Cemiyet'), ittihat: tagNamed('İttihat ve Terakki') };
  }

  it('merge moves the Collections to the Tag that stays, one using both keeping it once', async () => {
    const { api, draft, article, cemiyet, ittihat } = await cemiyetInCollections();

    await api.tags.merge({ id: cemiyet.id, intoId: ittihat.id });

    expect(names((await api.collections.view({ id: draft })).tags)).toEqual(['İttihat ve Terakki']);
    expect(names((await api.collections.view({ id: article })).tags)).toEqual(['İttihat ve Terakki']);
    expect(texts(await api.collections.view({ id: draft }))).toEqual(['Selanik şubesi.']);
  });

  it('delete first tells how many Collections it comes out of', async () => {
    const { api, cemiyet, ittihat } = await cemiyetInCollections();

    expect(await api.tags.deleteImpact({ id: cemiyet.id })).toEqual({
      name: 'Cemiyet',
      notes: 1,
      sources: 0,
      collections: 2,
    });
    expect(await api.tags.deleteImpact({ id: ittihat.id })).toMatchObject({ notes: 0, collections: 1 });
  });

  it('delete takes it out of every Collection, and Geri al puts it back in them', async () => {
    const { api, draft, article, cemiyet } = await cemiyetInCollections();

    const { undoToken } = await api.tags.delete({ id: cemiyet.id });
    expect(names((await api.collections.view({ id: draft })).tags)).toEqual([]);
    expect(names((await api.collections.view({ id: article })).tags)).toEqual(['İttihat ve Terakki']);

    await api.undo({ token: undoToken! });
    expect(names((await api.collections.view({ id: draft })).tags)).toEqual(['Cemiyet']);
    expect(names((await api.collections.view({ id: article })).tags)).toEqual(['Cemiyet', 'İttihat ve Terakki']);
    expect(texts(await api.collections.view({ id: draft }))).toEqual(['Selanik şubesi.']);
  });
});
