import { eq } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { account } from './db/schema';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

const KB = 1024;

/**
 * A JPEG as the app's image manipulator makes it: the start-of-image marker,
 * then `size` bytes in all. `fill` tells two pictures apart.
 */
function jpeg(size: number, fill = 7) {
  const bytes = new Uint8Array(size).fill(fill);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
}

const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

/** The two files the app uploads for one picture. */
function picture({ large = 300 * KB, small = 30 * KB, fill = 7 } = {}) {
  return { large: base64(jpeg(large, fill)), small: base64(jpeg(small, fill)) };
}

async function scholarWithSource() {
  const device = await t.signIn(scholarEmail());
  const api = await device.call();
  const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
  return { device, api, sourceId };
}

async function bytesOf(response: Response) {
  return new Uint8Array(await response.arrayBuffer());
}

describe('adding a Cover', () => {
  it('stores both files under the Account and shows them from the API, cached for good', async () => {
    const { device, api, sourceId } = await scholarWithSource();

    const { cover } = await api.covers.set({ sourceId, ...picture({ fill: 1 }) });

    expect(cover.large.startsWith(`${device.accountId}/`)).toBe(true);
    expect(cover.small.startsWith(`${device.accountId}/`)).toBe(true);
    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover });
    const large = await device.get(`/api/covers/${cover.large}`);
    expect(large.status).toBe(200);
    expect(large.headers.get('content-type')).toBe('image/jpeg');
    expect(large.headers.get('cache-control')).toContain('immutable');
    expect(await bytesOf(large)).toEqual(jpeg(300 * KB, 1));
    expect(await bytesOf(await device.get(`/api/covers/${cover.small}`))).toEqual(jpeg(30 * KB, 1));
  });
});

describe('where a Cover shows', () => {
  it('comes with its Source on Ana sayfa, in Kaynaklar and in search results', async () => {
    const { api, sourceId } = await scholarWithSource();
    const { id: without } = await api.sources.create({ type: 'article', title: 'Kadı Sicilleri Üzerine' });
    await api.notes.create({ id: uuidv7(), sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.' });

    const { cover } = await api.covers.set({ sourceId, ...picture() });

    expect(await api.sources.lastNoted()).toMatchObject({ source: { id: sourceId, cover } });
    expect(await api.sources.list({ sort: 'title' })).toEqual([
      expect.objectContaining({ id: without, cover: null }),
      expect.objectContaining({ id: sourceId, cover }),
    ]);
    expect((await api.search.library({ query: 'kadı' })).sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: sourceId, cover }),
        expect.objectContaining({ id: without, cover: null }),
      ]),
    );
  });
});

describe('what the API takes as a Cover', () => {
  const rejected = (message: string) => expect.objectContaining({ code: 'BAD_REQUEST', message });

  it.each([
    ['a large file over 400 KB', { large: 400 * KB + 1 }],
    ['a small file over 40 KB', { small: 40 * KB + 1 }],
  ])('refuses %s and keeps nothing', async (_, sizes) => {
    const { api, sourceId } = await scholarWithSource();

    await expect(api.covers.set({ sourceId, ...picture(sizes) })).rejects.toThrowError(rejected('COVER_TOO_LARGE'));

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: null });
  });

  it('takes files of exactly 400 KB and 40 KB', async () => {
    const { api, sourceId } = await scholarWithSource();

    await api.covers.set({ sourceId, ...picture({ large: 400 * KB, small: 40 * KB }) });

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: expect.any(Object) });
  });

  it('refuses anything that is not a JPEG', async () => {
    const { api, sourceId } = await scholarWithSource();
    const png = base64(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]));

    await expect(api.covers.set({ sourceId, large: png, small: picture().small })).rejects.toThrowError(
      rejected('COVER_NOT_JPEG'),
    );
    await expect(api.covers.set({ sourceId, large: picture().large, small: png })).rejects.toThrowError(
      rejected('COVER_NOT_JPEG'),
    );
    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: null });
  });
});

describe('changing and removing a Cover', () => {
  it('offers no Geri al for the first Cover', async () => {
    const { api, sourceId } = await scholarWithSource();

    expect(await api.covers.set({ sourceId, ...picture() })).toMatchObject({ undoToken: null });
  });

  it('replaces the Cover under new keys, and Geri al brings the earlier one back', async () => {
    const { device, api, sourceId } = await scholarWithSource();
    const { cover: first } = await api.covers.set({ sourceId, ...picture({ fill: 1 }) });

    const { cover: second, undoToken } = await api.covers.set({ sourceId, ...picture({ fill: 2 }) });

    expect(second.large).not.toBe(first.large);
    expect(second.small).not.toBe(first.small);
    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: second });
    expect(await bytesOf(await device.get(`/api/covers/${second.large}`))).toEqual(jpeg(300 * KB, 2));

    await api.undo({ token: undoToken! });

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: first });
    expect(await bytesOf(await device.get(`/api/covers/${first.large}`))).toEqual(jpeg(300 * KB, 1));
  });

  it('removes the Cover without asking, and Geri al brings it back', async () => {
    const { device, api, sourceId } = await scholarWithSource();
    const { cover } = await api.covers.set({ sourceId, ...picture() });

    const { undoToken } = await api.covers.remove({ sourceId });

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: null });
    expect((await device.get(`/api/covers/${cover.large}`)).status).toBe(404);

    await api.undo({ token: undoToken! });

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover });
    expect((await device.get(`/api/covers/${cover.small}`)).status).toBe(200);
  });

  it('offers no Geri al when there was no Cover to remove', async () => {
    const { api, sourceId } = await scholarWithSource();

    expect(await api.covers.remove({ sourceId })).toEqual({ undoToken: null });
  });

  it('brings the Cover back with its Source when deleting the Source is taken back', async () => {
    const { device, api, sourceId } = await scholarWithSource();
    const { cover } = await api.covers.set({ sourceId, ...picture() });

    const { undoToken } = await api.sources.delete({ id: sourceId });
    expect((await device.get(`/api/covers/${cover.large}`)).status).toBe(404);
    await api.undo({ token: undoToken! });

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover });
    expect((await device.get(`/api/covers/${cover.large}`)).status).toBe(200);
  });

  it('finds no Source to give a Cover to once it is deleted', async () => {
    const { api, sourceId } = await scholarWithSource();
    await api.sources.delete({ id: sourceId });

    await expect(api.covers.set({ sourceId, ...picture() })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(api.covers.remove({ sourceId })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe("another Library's Cover", () => {
  it('cannot be seen, replaced or removed from another Account', async () => {
    const { api, sourceId } = await scholarWithSource();
    const { cover } = await api.covers.set({ sourceId, ...picture() });
    const stranger = await t.signIn(scholarEmail('yabanci'));
    const theirs = await stranger.call();

    expect((await stranger.get(`/api/covers/${cover.large}`)).status).toBe(404);
    expect((await stranger.get(`/api/covers/${cover.small}`)).status).toBe(404);
    await expect(theirs.covers.set({ sourceId, ...picture() })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(theirs.covers.remove({ sourceId })).rejects.toMatchObject({ code: 'NOT_FOUND' });

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover });
  });

  it('is not shown to a request without a session', async () => {
    const { api, sourceId } = await scholarWithSource();
    const { cover } = await api.covers.set({ sourceId, ...picture() });

    expect((await t.api.http.request(`/api/covers/${cover.large}`)).status).toBe(401);
  });
});

describe('a Cover whose file is gone', () => {
  it('is forgotten when it is asked for, and the Source falls back to its template', async () => {
    const { device, api, sourceId } = await scholarWithSource();
    const { cover } = await api.covers.set({ sourceId, ...picture() });
    t.covers.lose(cover.large);

    expect((await device.get(`/api/covers/${cover.large}`)).status).toBe(404);

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ cover: null });
  });
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

describe('the daily Cover clean-up', () => {
  it('deletes files no Source points at once they are a day old', async () => {
    const { api, sourceId } = await scholarWithSource();
    const { cover: replaced } = await api.covers.set({ sourceId, ...picture({ fill: 1 }) });
    await api.covers.set({ sourceId, ...picture({ fill: 2 }) });

    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + DAY_MS - HOUR_MS));
    expect(t.covers.has(replaced.large)).toBe(true);

    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + DAY_MS + HOUR_MS));
    expect(t.covers.has(replaced.large)).toBe(false);
    expect(t.covers.has(replaced.small)).toBe(false);
  });

  it('keeps every file a Source points at, however old', async () => {
    const { api, sourceId } = await scholarWithSource();
    const { cover } = await api.covers.set({ sourceId, ...picture() });

    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + 30 * DAY_MS));

    expect(t.covers.has(cover.large)).toBe(true);
    expect(t.covers.has(cover.small)).toBe(true);
  });

  it("leaves Open Library's covers under isbn/ alone", async () => {
    await t.covers.put('isbn/9789750719387.jpg', jpeg(20 * KB));

    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + 30 * DAY_MS));

    expect(t.covers.has('isbn/9789750719387.jpg')).toBe(true);
  });

  it('keeps an old Cover while Geri al can still bring it back', async () => {
    const { api, sourceId } = await scholarWithSource();
    t.passTime(-2 * DAY_MS);
    const { cover } = await api.covers.set({ sourceId, ...picture() });
    t.passTime(2 * DAY_MS);

    await api.covers.remove({ sourceId });

    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + 60 * 1000));
    expect(t.covers.has(cover.large)).toBe(true);

    await t.api.jobs.deleteUnusedCovers(new Date(Date.now() + DAY_MS));
    expect(t.covers.has(cover.large)).toBe(false);
  });

  it("deletes a deleted Account's files on the first run after its rows go", async () => {
    const email = scholarEmail();
    const device = await t.signIn(email);
    const api = await device.call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { cover } = await api.covers.set({ sourceId, ...picture() });
    await api.account.requestDeletion();
    await (await device.call()).account.confirmDeletion({ code: t.mail.lastCodeFor(email) });
    const later = new Date(Date.now() + 15 * DAY_MS);

    await t.api.jobs.deleteUnusedCovers(later);
    expect(t.covers.has(cover.large)).toBe(true);

    // What the 14th day's job does to it (account-deletion.test.ts). Run as
    // the job, it would also delete the Accounts other test files close.
    await t.owner.delete(account).where(eq(account.id, device.accountId));
    await t.api.jobs.deleteUnusedCovers(later);
    expect(t.covers.has(cover.large)).toBe(false);
    expect(t.covers.has(cover.small)).toBe(false);
  });
});
