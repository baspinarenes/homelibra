import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * An edition as Open Library's Books API gives it (jscmd=data), after
 * 9789750521188 in docs/research/turkish-metadata-lookup.md: an Amazon-style
 * date, the publisher in one of its many spellings.
 */
const cereyanlar = {
  url: 'https://openlibrary.org/books/OL28141235M/Cereyanlar',
  key: '/books/OL28141235M',
  title: 'Cereyanlar',
  subtitle: "Türkiye'de Siyasî İdeolojiler",
  authors: [{ url: 'https://openlibrary.org/authors/OL7512398A', name: 'Tanıl Bora' }],
  identifiers: { isbn_13: ['9789750521188'], openlibrary: ['OL28141235M'] },
  publishers: [{ name: 'İletişim Yayınları' }],
  publish_places: [{ name: 'İstanbul' }],
  publish_date: 'Nov 01, 2017',
  number_of_pages: 750,
};

/** A cover picture as Open Library keeps it, `width` × `height` px. */
function picture(width: number, height: number, format: 'jpeg' | 'png' = 'jpeg') {
  const image = sharp({ create: { width, height, channels: 3, background: { r: 140, g: 60, b: 30 } } });
  return image[format]()
    .toBuffer()
    .then((buffer) => new Uint8Array(buffer));
}

async function sizeOf(bytes: Uint8Array | null) {
  if (!bytes) throw new Error('no file');
  const { width, height, format } = await sharp(bytes).metadata();
  return { width, height, format };
}

async function bytesOf(response: Response) {
  return new Uint8Array(await response.arrayBuffer());
}

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}

describe('ISBN ile öner', () => {
  it("suggests the Book form's fields from Open Library, the year Milâdî", async () => {
    t.openLibrary.publish('9789750521188', cereyanlar);
    const api = await scholar();

    expect(await api.lookups.isbn({ isbn: '978-975-05-2118-8' })).toEqual({
      isbn: '9789750521188',
      title: "Cereyanlar: Türkiye'de Siyasî İdeolojiler",
      author: 'Tanıl Bora',
      date: { calendar: 'gregorian', year: 2017 },
      fields: { publisher: 'İletişim Yayınları', placeOfPublication: 'İstanbul' },
      cover: null,
    });
  });
});

describe('the shared lookup cache', () => {
  it('asks Open Library once for an ISBN, whichever Library asks and however it is written', async () => {
    t.openLibrary.publish('9789750525360', { ...cereyanlar, title: "Modernleşen Türkiye'nin Tarihi" });

    const first = await (await scholar()).lookups.isbn({ isbn: '9789750525360' });
    const second = await (await scholar()).lookups.isbn({ isbn: '978 975 05 2536 0' });

    expect(second).toEqual(first);
    expect(t.openLibrary.askedFor('9789750525360')).toBe(1);
  });

  it('turns an ISBN-10 into the ISBN-13 it asks for', async () => {
    t.openLibrary.publish('9789754700114', { title: 'Tutunamayanlar', authors: [{ name: 'Oğuz Atay' }] });

    expect(await (await scholar()).lookups.isbn({ isbn: '975-470-011-7' })).toMatchObject({
      isbn: '9789754700114',
      title: 'Tutunamayanlar',
    });
  });

  it('remembers "bulunamadı" for seven days, then asks Open Library again', async () => {
    const api = await scholar();
    const isbn = '9786256774254';

    expect(await api.lookups.isbn({ isbn })).toBeNull();
    t.openLibrary.publish(isbn, { title: "Türkiye'de Siyasal Partiler" });

    t.passTime(7 * DAY_MS - 60_000);
    expect(await api.lookups.isbn({ isbn })).toBeNull();
    expect(t.openLibrary.askedFor(isbn)).toBe(1);

    t.passTime(60_000);
    expect(await api.lookups.isbn({ isbn })).toMatchObject({ title: "Türkiye'de Siyasal Partiler" });
    expect(t.openLibrary.askedFor(isbn)).toBe(2);
  });

  it('keeps nothing when Open Library fails, so the next try asks again', async () => {
    const api = await scholar();
    const isbn = '9786057707345';
    t.openLibrary.publish(isbn, { title: 'İttihat ve Terakki 1908-1914' });
    t.openLibrary.fail();

    await expect(api.lookups.isbn({ isbn })).rejects.toThrow();

    t.openLibrary.fail(false);
    expect(await api.lookups.isbn({ isbn })).toMatchObject({ title: 'İttihat ve Terakki 1908-1914' });
    expect(t.openLibrary.askedFor(isbn)).toBe(2);
  });

  it('refuses what is not an ISBN, or one whose check digit is wrong', async () => {
    const api = await scholar();

    await expect(api.lookups.isbn({ isbn: '10.37879/belleten.2026.345' })).rejects.toThrow();
    await expect(api.lookups.isbn({ isbn: '9789750521187' })).rejects.toThrow();
  });
});

describe("Open Library's cover", () => {
  it('is offered with the fields, resized and kept under isbn/ for every Library', async () => {
    const isbn = '9789752430365';
    t.openLibrary.publish(isbn, { title: 'İmparatorluğun En Uzun Yüzyılı', authors: [{ name: 'İlber Ortaylı' }] });
    t.openLibrary.publishCover(isbn, await picture(1500, 2250));
    const device = await t.signIn(scholarEmail());
    const api = await device.call();

    const suggestion = await api.lookups.isbn({ isbn });

    expect(suggestion?.cover).toEqual({ large: `isbn/${isbn}.jpg`, small: `isbn/${isbn}-small.jpg` });
    expect(await sizeOf(await t.covers.storage.get(`isbn/${isbn}.jpg`))).toEqual({
      width: 667,
      height: 1000,
      format: 'jpeg',
    });
    expect(await sizeOf(await t.covers.storage.get(`isbn/${isbn}-small.jpg`))).toEqual({
      width: 160,
      height: 240,
      format: 'jpeg',
    });
    // The suggestion screen shows it from the API, as any Cover.
    const shown = await device.get(`/api/covers/isbn/${isbn}-small.jpg`);
    expect(shown.status).toBe(200);
    expect(await bytesOf(shown)).toEqual(await t.covers.storage.get(`isbn/${isbn}-small.jpg`));

    expect((await (await scholar()).lookups.isbn({ isbn }))?.cover).toEqual(suggestion?.cover);
    expect(t.openLibrary.coverAskedFor(isbn)).toBe(1);
  });

  it('is never enlarged, and comes as a JPEG whatever Open Library keeps', async () => {
    const isbn = '9789752637061';
    t.openLibrary.publish(isbn, { title: 'İmparatorluğun En Uzun Yüzyılı' });
    t.openLibrary.publishCover(isbn, await picture(180, 270, 'png'));

    await (await scholar()).lookups.isbn({ isbn });

    expect(await sizeOf(await t.covers.storage.get(`isbn/${isbn}.jpg`))).toEqual({
      width: 180,
      height: 270,
      format: 'jpeg',
    });
  });

  it('is remembered missing for seven days, then asked for again', async () => {
    const isbn = '9789750805882';
    t.openLibrary.publish(isbn, { title: 'Osmanlı İmparatorluğu Klasik Çağ' });
    const api = await scholar();

    expect((await api.lookups.isbn({ isbn }))?.cover).toBeNull();
    t.openLibrary.publishCover(isbn, await picture(400, 600));

    t.passTime(7 * DAY_MS - 60_000);
    expect((await api.lookups.isbn({ isbn }))?.cover).toBeNull();
    expect(t.openLibrary.coverAskedFor(isbn)).toBe(1);

    t.passTime(60_000);
    expect((await api.lookups.isbn({ isbn }))?.cover).toEqual({
      large: `isbn/${isbn}.jpg`,
      small: `isbn/${isbn}-small.jpg`,
    });
    expect(t.openLibrary.coverAskedFor(isbn)).toBe(2);
  });

  it('is not asked for when Open Library does not know the ISBN', async () => {
    const isbn = '9789754705317';

    expect(await (await scholar()).lookups.isbn({ isbn })).toBeNull();
    expect(t.openLibrary.coverAskedFor(isbn)).toBe(0);
  });

  it('leaves the fields offered when the cover cannot be had, and is asked for again next time', async () => {
    const isbn = '9786254053696';
    t.openLibrary.publish(isbn, { title: "Devlet-i 'Aliyye V" });
    t.openLibrary.publishCover(isbn, new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]));
    const api = await scholar();

    expect(await api.lookups.isbn({ isbn })).toMatchObject({ title: "Devlet-i 'Aliyye V", cover: null });

    t.openLibrary.publishCover(isbn, await picture(400, 600));
    expect((await api.lookups.isbn({ isbn }))?.cover).not.toBeNull();
  });
});

/** A scholar who asked for a suggestion and saved its Book; Open Library has a cover for it. */
async function bookWithSuggestedCover(isbn: string) {
  t.openLibrary.publish(isbn, { title: 'Türk Demokrasi Tarihi', authors: [{ name: 'Kemal Karpat' }] });
  t.openLibrary.publishCover(isbn, await picture(600, 900));
  const device = await t.signIn(scholarEmail());
  const api = await device.call();
  const suggestion = await api.lookups.isbn({ isbn });
  const { id: sourceId } = await api.sources.create({ type: 'book', title: suggestion?.title ?? '', isbn });
  return { device, api, sourceId };
}

describe('accepting the cover', () => {
  it('copies it into the Library as an ordinary Cover', async () => {
    const isbn = '9786051141756';
    const { device, api, sourceId } = await bookWithSuggestedCover(isbn);

    const { cover, undoToken } = await api.covers.setFromOpenLibrary({ sourceId, isbn });

    expect(cover.large.startsWith(`${device.accountId}/`)).toBe(true);
    expect(cover.small.startsWith(`${device.accountId}/`)).toBe(true);
    expect(undoToken).toBeNull();
    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover });
    expect(await bytesOf(await device.get(`/api/covers/${cover.large}`))).toEqual(
      await t.covers.storage.get(`isbn/${isbn}.jpg`),
    );
    expect(await bytesOf(await device.get(`/api/covers/${cover.small}`))).toEqual(
      await t.covers.storage.get(`isbn/${isbn}-small.jpg`),
    );
  });

  it('goes like any Cover once removed, and leaves the shared one in place', async () => {
    const isbn = '9789755334257';
    const { api, sourceId } = await bookWithSuggestedCover(isbn);
    const { cover } = await api.covers.setFromOpenLibrary({ sourceId, isbn });

    await api.covers.remove({ sourceId });
    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + 2 * DAY_MS));

    expect(t.covers.has(cover.large)).toBe(false);
    expect(t.covers.has(`isbn/${isbn}.jpg`)).toBe(true);
    expect(t.covers.has(`isbn/${isbn}-small.jpg`)).toBe(true);
  });

  it('replaces a Cover the Source had, and Geri al brings that one back', async () => {
    const isbn = '9789750508394';
    const { api, sourceId } = await bookWithSuggestedCover(isbn);
    const { cover: first } = await api.covers.setFromOpenLibrary({ sourceId, isbn });

    const { cover: second, undoToken } = await api.covers.setFromOpenLibrary({ sourceId, isbn });
    expect(second.large).not.toBe(first.large);
    if (!undoToken) throw new Error('no Geri al offered');

    await api.undo({ token: undoToken });
    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: first });
  });

  it('finds no cover to copy when Open Library has none', async () => {
    const isbn = '9789754700237';
    t.openLibrary.publish(isbn, { title: 'Jön Türklerin Siyasî Fikirleri' });
    const api = await scholar();
    await api.lookups.isbn({ isbn });
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Jön Türklerin Siyasî Fikirleri' });

    await expect(api.covers.setFromOpenLibrary({ sourceId, isbn })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: null });
  });

  it('forgets a shared cover whose files are gone, and asks Open Library for it again', async () => {
    const isbn = '9786050911886';
    const { api, sourceId } = await bookWithSuggestedCover(isbn);
    t.covers.lose(`isbn/${isbn}.jpg`);

    await expect(api.covers.setFromOpenLibrary({ sourceId, isbn })).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect((await api.lookups.isbn({ isbn }))?.cover).not.toBeNull();
    expect(t.openLibrary.coverAskedFor(isbn)).toBe(2);
    expect(t.covers.has(`isbn/${isbn}.jpg`)).toBe(true);
  });

  it("cannot put a cover on another Account's Source", async () => {
    const isbn = '9789753332453';
    const { sourceId } = await bookWithSuggestedCover(isbn);
    const other = await scholar();

    await expect(other.covers.setFromOpenLibrary({ sourceId, isbn })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('what stays out of the shared cache', () => {
  it("never shares a scholar's own Cover with the next Library", async () => {
    const isbn = '9789750500930';
    t.openLibrary.publish(isbn, { title: 'Osmanlı İmparatorluğu 1700-1922' });
    const first = await scholar();
    const { id: sourceId } = await first.sources.create({ type: 'book', title: 'Osmanlı İmparatorluğu', isbn });
    await first.covers.set({
      sourceId,
      large: Buffer.from(await picture(600, 900)).toString('base64'),
      small: Buffer.from(await picture(160, 240)).toString('base64'),
    });

    expect((await (await scholar()).lookups.isbn({ isbn }))?.cover).toBeNull();
    expect(t.openLibrary.coverAskedFor(isbn)).toBe(1);
    expect(t.covers.has(`isbn/${isbn}.jpg`)).toBe(false);
  });

  it('is never touched by the daily clean-up, however old', async () => {
    const isbn = '9789755332413';
    t.openLibrary.publish(isbn, { title: 'Jön Türkler ve İttihat ve Terakki' });
    t.openLibrary.publishCover(isbn, await picture(600, 900));
    await (await scholar()).lookups.isbn({ isbn });

    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + 365 * DAY_MS));

    expect(t.covers.has(`isbn/${isbn}.jpg`)).toBe(true);
    expect(t.covers.has(`isbn/${isbn}-small.jpg`)).toBe(true);
  });
});
