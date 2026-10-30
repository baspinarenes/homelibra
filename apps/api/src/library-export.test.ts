import { strFromU8, unzipSync } from 'fflate';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { libraryExportJsonSchema, libraryExportSchema } from './export/schema';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

const KB = 1024;

/** A JPEG as the app makes it: the start-of-image marker, then `size` bytes in all; `fill` tells two apart. */
function jpeg(size: number, fill: number) {
  const bytes = new Uint8Array(size).fill(fill);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
}

const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

async function scholar() {
  const device = await t.signIn(scholarEmail());
  return { device, api: await device.call() };
}

type Device = Awaited<ReturnType<typeof scholar>>['device'];

/** Downloads the Library export as Ayarlar → Hesap ve gizlilik does on the web, and opens the ZIP. */
async function download(device: Device) {
  const response = await device.get('/api/export');
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/zip');
  const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const library = libraryExportSchema.parse(JSON.parse(strFromU8(files['kutuphane.json']!)));
  return { response, files, library };
}

describe('downloading the Library export', () => {
  it('gives one ZIP whose JSON holds the Library, as its schema says', async () => {
    const { device, api } = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const noteId = uuidv7();
    await api.notes.create({ id: noteId, sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.' });

    const { library } = await download(device);

    expect(library.sources).toMatchObject([{ id: sourceId, type: 'book', title: 'Taşrada Kadı ve Naib' }]);
    expect(library.notes).toMatchObject([
      { id: noteId, sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.', comment: null },
    ]);
  });

  it('keeps every field of a Source, the ones its type hides too, and each Date in its own calendar', async () => {
    const { device, api } = await scholar();
    const { id } = await api.sources.create({
      type: 'book',
      title: 'Osmanlı’da Kadılık',
      author: 'Suraiya Faroqhi (ed.)',
      isbn: '978-975-08-0000-1',
      bibliographicNote: 'Çev. Z. Altok.',
      date: { calendar: 'hijri', year: 1310, month: 12, day: 29 },
      fields: { publisher: 'Tarih Vakfı', firstEditionDate: { calendar: 'rumi', year: 1327, month: 1 } },
    });
    // An Archive has no Yayınevi or ISBN: they are hidden, not gone.
    await api.sources.update({ id, type: 'archive' });

    const { library } = await download(device);

    expect(library.sources).toEqual([
      expect.objectContaining({
        id,
        type: 'archive',
        title: 'Osmanlı’da Kadılık',
        author: 'Suraiya Faroqhi (ed.)',
        isbn: '978-975-08-0000-1',
        doi: null,
        bibliographicNote: 'Çev. Z. Altok.',
        date: { calendar: 'hijri', year: 1310, month: 12, day: 29 },
        fields: { publisher: 'Tarih Vakfı', firstEditionDate: { calendar: 'rumi', year: 1327, month: 1 } },
        hiddenFields: ['isbn', 'publisher', 'firstEditionDate'],
        readingStatus: 'reading',
      }),
    ]);
  });

  it('keeps a Note’s own Tags apart from its Source’s, and each Collection’s definition', async () => {
    const { device, api } = await scholar();
    const { id: sourceId } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'DH.MKT' });
    await api.tags.setOnSource({ sourceId, names: ['Ermeni meselesi'] });
    const tagged = uuidv7();
    await api.notes.create({ id: tagged, sourceId, locator: '1235/1', excerpt: 'Telgraf.', tags: ['#Kadı', 'âlem'] });
    const untagged = uuidv7();
    await api.notes.create({ id: untagged, sourceId, locator: '1234/56', comment: 'Tahrirat yok.' });
    const { id: collectionId } = await api.collections.create({
      name: 'Taşra',
      tags: ['kadı', 'Ermeni meselesi'],
      includeSourceNotes: false,
    });

    const { library } = await download(device);

    expect(library.sources).toMatchObject([{ id: sourceId, tags: ['Ermeni meselesi'] }]);
    expect(library.notes).toMatchObject([
      { id: untagged, locator: '1234/56', excerpt: null, comment: 'Tahrirat yok.', tags: [] },
      { id: tagged, locator: '1235/1', tags: ['âlem', 'Kadı'] },
    ]);
    expect(library.tags.map((tag) => tag.name)).toEqual(['âlem', 'Ermeni meselesi', 'Kadı']);
    expect(library.collections).toMatchObject([
      { id: collectionId, name: 'Taşra', tags: ['Ermeni meselesi', 'Kadı'], includeSourceNotes: false },
    ]);
  });
});

describe('the Markdown in the export', () => {
  it('has a file per Source with its Notes in Locator order, as "Markdown olarak kopyala" writes them', async () => {
    const { device, api } = await scholar();
    const { id: sourceId } = await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      author: 'Halil İnalcık',
      date: { calendar: 'hijri', year: 1310 },
    });
    await api.notes.create({ id: uuidv7(), sourceId, locator: 's. 45-47', excerpt: 'Naib tayini.' });
    await api.notes.create({
      id: uuidv7(),
      sourceId,
      locator: 's. 12',
      excerpt: 'Kadı, naibini\nkendisi seçerdi.',
      comment: 'Bkz. sicil.',
    });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Eserin bütünü üzerine.' });
    const { id: empty } = await api.sources.create({ type: 'archive', author: 'BOA', title: 'DH.MKT 1234/56' });

    const { files, library } = await download(device);

    const markdownOf = (id: string) => library.sources.find((s) => s.id === id)!.markdown;
    expect(strFromU8(files[markdownOf(sourceId)]!)).toBe(
      [
        '## Halil İnalcık, Taşrada Kadı ve Naib (1310 h.)',
        'Eserin bütünü üzerine.',
        '**s. 12**',
        '> Kadı, naibini\n> kendisi seçerdi.',
        'Bkz. sicil.',
        '**s. 45-47**',
        '> Naib tayini.',
      ].join('\n\n') + '\n',
    );
    expect(markdownOf(empty)).toBe('kaynaklar/DH.MKT 1234 56.md');
    expect(strFromU8(files[markdownOf(empty)]!)).toBe('## BOA, DH.MKT 1234/56\n');
  });

  it('gives two Sources of the same Başlık two files', async () => {
    const { device, api } = await scholar();
    await api.sources.create({ type: 'book', title: 'Kadı Sicilleri' });
    await api.sources.create({ type: 'article', title: 'kadı sicilleri' });

    const { files, library } = await download(device);

    // Apart even where only letter case differs, as macOS and Windows see names.
    const paths = library.sources.map((s) => s.markdown.toLocaleLowerCase('tr'));
    expect(new Set(paths).size).toBe(2);
    expect(library.sources.map((s) => strFromU8(files[s.markdown]!))).toEqual(
      library.sources.map((s) => `## ${s.title}\n`),
    );
  });
});

describe('Covers in the export', () => {
  it('holds each Cover’s large file under kapaklar/, named in its Source, and leaves out one whose file is gone', async () => {
    const { device, api } = await scholar();
    const { id: kept } = await api.sources.create({ type: 'book', title: 'Kapaklı' });
    const { id: lost } = await api.sources.create({ type: 'book', title: 'Kapağı kaybolmuş' });
    const { id: none } = await api.sources.create({ type: 'book', title: 'Kapaksız' });
    await api.covers.set({ sourceId: kept, large: base64(jpeg(300 * KB, 1)), small: base64(jpeg(30 * KB, 1)) });
    const { cover } = await api.covers.set({
      sourceId: lost,
      large: base64(jpeg(300 * KB, 2)),
      small: base64(jpeg(30 * KB, 2)),
    });
    t.covers.lose(cover.large);

    const { files, library } = await download(device);

    const coverOf = (id: string) => library.sources.find((s) => s.id === id)!.cover;
    expect(coverOf(kept)).toBe(`kapaklar/${kept}.jpg`);
    expect(files[`kapaklar/${kept}.jpg`]).toEqual(jpeg(300 * KB, 1));
    expect(coverOf(lost)).toBeNull();
    expect(coverOf(none)).toBeNull();
    expect(Object.keys(files).filter((path) => path.startsWith('kapaklar/'))).toEqual([`kapaklar/${kept}.jpg`]);
    const markdown = library.sources.find((s) => s.id === kept)!.markdown;
    expect(strFromU8(files[markdown]!)).toBe('## Kapaklı\n');
  });
});

describe('whose Library goes into the export', () => {
  it('holds nothing of another Account’s Library', async () => {
    const mine = await scholar();
    const theirs = await scholar();
    const { id: mySource } = await mine.api.sources.create({ type: 'book', title: 'Benim kaynağım' });
    await mine.api.notes.create({ id: uuidv7(), sourceId: mySource, excerpt: 'Benim notum.', tags: ['benim'] });
    await mine.api.collections.create({ name: 'Benim dosyam', tags: ['benim'] });
    const { id: theirSource } = await theirs.api.sources.create({ type: 'book', title: 'Onun kaynağı' });
    await theirs.api.notes.create({ id: uuidv7(), sourceId: theirSource, excerpt: 'Onun notu.', tags: ['onun'] });
    await theirs.api.collections.create({ name: 'Onun dosyası', tags: ['onun'] });
    await theirs.api.covers.set({
      sourceId: theirSource,
      large: base64(jpeg(300 * KB, 3)),
      small: base64(jpeg(30 * KB, 3)),
    });

    const { files, library } = await download(mine.device);

    expect(library.sources.map((s) => s.title)).toEqual(['Benim kaynağım']);
    expect(library.notes.map((n) => n.excerpt)).toEqual(['Benim notum.']);
    expect(library.tags.map((tag) => tag.name)).toEqual(['benim']);
    expect(library.collections.map((c) => c.name)).toEqual(['Benim dosyam']);
    expect(Object.keys(files).some((path) => path.startsWith('kapaklar/'))).toBe(false);
  });

  it('is refused to a request without a session', async () => {
    const response = await t.api.http.request('/api/export');

    expect(response.status).toBe(401);
  });
});

describe('the schema document', () => {
  it('goes into the ZIP beside the JSON, with a page saying what each file is', async () => {
    const { device } = await scholar();

    const { files, response } = await download(device);

    expect(JSON.parse(strFromU8(files['kutuphane.schema.json']!))).toEqual(libraryExportJsonSchema());
    expect(strFromU8(files['BENIOKU.md']!)).toContain('kutuphane.schema.json');
    expect(response.headers.get('content-disposition')).toMatch(
      /^attachment; filename="homelibra-\d{4}-\d{2}-\d{2}\.zip"$/,
    );
  });
});
