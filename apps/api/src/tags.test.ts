import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { withLibrary } from './db/client';
import { tag } from './db/schema';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholarWithSource() {
  const api = await (await t.signIn(scholarEmail())).call();
  const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
  return { api, sourceId };
}

const names = (tags: { name: string }[]) => tags.map((tag) => tag.name);

describe('Tag identity', () => {
  it('makes names that differ only in case or spacing one Tag, shown as first entered', async () => {
    const { api, sourceId } = await scholarWithSource();
    const first = uuidv7();
    const second = uuidv7();

    await api.notes.create({ id: first, sourceId, excerpt: 'Cemiyet kuruldu.', tags: ['ittihat ve terakki'] });
    await api.notes.create({ id: second, sourceId, excerpt: 'Kongre toplandı.', tags: ['  İttihat   ve Terakki'] });

    expect(await api.tags.list({ sort: 'name' })).toEqual([
      { id: expect.any(String), name: 'ittihat ve terakki', noteCount: 2, sourceCount: 0 },
    ]);
    const [a, b] = await api.notes.list({ sourceId });
    expect(a?.tags).toEqual(b?.tags);
  });

  it('keeps circumflexes, ı/i and punctuation apart: two Tags each', async () => {
    const { api, sourceId } = await scholarWithSource();

    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Bir.', tags: ['âlem', 'kır', 'Ahmed Cevdet'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'İki.', tags: ['alem', 'kir', 'Ahmed-Cevdet'] });

    expect(names(await api.tags.list({ sort: 'name' }))).toEqual([
      'Ahmed Cevdet',
      'Ahmed-Cevdet',
      'alem',
      'âlem',
      'kır',
      'kir',
    ]);
  });

  it('drops a leading #, and a Note carries a Tag once however often it is named', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();

    await api.notes.create({ id, sourceId, comment: 'Gazete.', tags: ['#basın', 'Basın', ' basın '] });

    expect((await api.notes.get({ id })).tags).toEqual([{ id: expect.any(String), name: 'basın' }]);
  });

  it('is per Library: the same name in two Libraries is two Tags', async () => {
    const mine = await scholarWithSource();
    const theirs = await scholarWithSource();

    await mine.api.notes.create({ id: uuidv7(), sourceId: mine.sourceId, comment: 'Bir.', tags: ['kadı'] });
    await theirs.api.notes.create({ id: uuidv7(), sourceId: theirs.sourceId, comment: 'İki.', tags: ['Kadı'] });

    expect(names(await mine.api.tags.list({ sort: 'name' }))).toEqual(['kadı']);
    expect(names(await theirs.api.tags.list({ sort: 'name' }))).toEqual(['Kadı']);
  });
});

describe("A Note's Tags", () => {
  it('are changed in note editing, the rest of the Note staying as it was', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: 's. 45', excerpt: 'Kadı naibini seçerdi.', tags: ['kadı'] });

    await api.notes.update({ id, tags: ['naib', 'Kadı'] });

    expect(await api.notes.get({ id })).toMatchObject({
      locator: 's. 45',
      excerpt: 'Kadı naibini seçerdi.',
      tags: [
        { id: expect.any(String), name: 'kadı' },
        { id: expect.any(String), name: 'naib' },
      ],
    });
  });

  it('chosen for a Comment that joins its Excerpt are added to the Excerpt’s Note', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: 's. 45', excerpt: 'Kadı naibini seçerdi.', tags: ['kadı'] });

    await api.notes.attachComment({ id, comment: 'Kiralama mı?', tags: ['naib', 'Kadı'] });

    expect(names((await api.notes.get({ id })).tags)).toEqual(['kadı', 'naib']);
  });

  it('are left alone by an edit that does not name them', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, excerpt: 'Kadı naibini seçerdi.', tags: ['kadı'] });

    await api.notes.update({ id, comment: 'Kiralama?' });

    expect(names((await api.notes.get({ id })).tags)).toEqual(['kadı']);
  });

  it('are not put on again when a captured Note is sent a second time', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    const capture = { id, sourceId, excerpt: 'Kadı naibini seçerdi.', tags: ['kadı'] };
    await api.notes.create(capture);
    await api.notes.update({ id, tags: [] });

    // The outbox sends the capture again after the edit.
    await api.notes.create(capture);

    expect((await api.notes.get({ id })).tags).toEqual([]);
  });
});

describe('An unused Tag', () => {
  it('goes when the last Note carrying it lets it go', async () => {
    const { api, sourceId } = await scholarWithSource();
    const first = uuidv7();
    const second = uuidv7();
    await api.notes.create({ id: first, sourceId, comment: 'Bir.', tags: ['kadı', 'naib'] });
    await api.notes.create({ id: second, sourceId, comment: 'İki.', tags: ['kadı'] });

    await api.notes.update({ id: first, tags: [] });

    expect(await api.tags.list({ sort: 'name' })).toMatchObject([{ name: 'kadı', noteCount: 1 }]);
  });

  it('goes when the last Source carrying it lets it go, but not while a Note still does', async () => {
    const { api, sourceId } = await scholarWithSource();
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Bir.', tags: ['kadı'] });
    await api.tags.setOnSource({ sourceId, names: ['kadı', 'Selanik'] });

    await api.tags.setOnSource({ sourceId, names: [] });

    expect(await api.tags.list({ sort: 'name' })).toMatchObject([{ name: 'kadı', noteCount: 1, sourceCount: 0 }]);
  });

  it('comes back as new when it is named again, spelled the new way', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Bir.', tags: ['ittihat ve terakki'] });
    await api.notes.update({ id, tags: [] });

    await api.notes.update({ id, tags: ['İttihat ve Terakki'] });

    expect(names(await api.tags.list({ sort: 'name' }))).toEqual(['İttihat ve Terakki']);
  });

  it('goes with the last Note carrying it when the Note is deleted', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Bir.', tags: ['kadı', 'naib'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'İki.', tags: ['kadı'] });

    await api.notes.delete({ id });

    expect(await api.tags.list({ sort: 'name' })).toMatchObject([{ name: 'kadı', noteCount: 1 }]);
  });
});

describe('Geri al', () => {
  it('after Notu sil brings the Note back with its Tags, and a Tag that went with it', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Bir.', tags: ['kadı', 'naib'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'İki.', tags: ['kadı'] });
    const before = await api.tags.list({ sort: 'name' });
    const { undoToken } = await api.notes.delete({ id });

    await api.undo({ token: undoToken! });

    expect((await api.notes.get({ id })).tags).toEqual([
      { id: before[0]!.id, name: 'kadı' },
      { id: before[1]!.id, name: 'naib' },
    ]);
    expect(await api.tags.list({ sort: 'name' })).toEqual(before);
  });

  it('after Notu sil puts the link back on a Tag its Source kept all along', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Bir.', tags: ['kadı'] });
    await api.tags.setOnSource({ sourceId, names: ['kadı'] });
    const before = await api.tags.list({ sort: 'name' });
    const { undoToken } = await api.notes.delete({ id });
    expect(await api.tags.list({ sort: 'name' })).toMatchObject([{ id: before[0]!.id, noteCount: 0, sourceCount: 1 }]);

    await api.undo({ token: undoToken! });

    expect((await api.notes.get({ id })).tags).toEqual([{ id: before[0]!.id, name: 'kadı' }]);
    expect(await api.tags.list({ sort: 'name' })).toEqual(before);
  });

  it("after Kaynağı sil brings back the Source's Tags and its Notes' own", async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Bir.', tags: ['kadı'] });
    await api.tags.setOnSource({ sourceId, names: ['Çorum', 'kadı'] });
    const before = await api.tags.list({ sort: 'name' });
    const { undoToken } = await api.sources.delete({ id: sourceId });
    expect(await api.tags.list({ sort: 'name' })).toEqual([]);

    await api.undo({ token: undoToken! });

    expect(names((await api.sources.get({ id: sourceId })).tags)).toEqual(['Çorum', 'kadı']);
    expect(names((await api.notes.get({ id })).tags)).toEqual(['kadı']);
    expect(await api.tags.list({ sort: 'name' })).toEqual(before);
  });

  it('puts the links on a Tag named again meanwhile under the same identity, with its new spelling', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Bir.', tags: ['naib'] });
    const { undoToken } = await api.notes.delete({ id });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'İki.', tags: ['Naib'] });

    await api.undo({ token: undoToken! });

    expect(names((await api.notes.get({ id })).tags)).toEqual(['Naib']);
    expect(await api.tags.list({ sort: 'name' })).toMatchObject([{ name: 'Naib', noteCount: 2 }]);
  });

  it('after a move leaves the Note with its Tags', async () => {
    const { api, sourceId } = await scholarWithSource();
    const { id: other } = await api.sources.create({ type: 'archive', title: 'DH.MKT' });
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Bir.', tags: ['kadı'] });
    const { undoToken } = await api.notes.move({ id, sourceId: other });
    expect(names((await api.notes.get({ id })).tags)).toEqual(['kadı']);

    await api.undo({ token: undoToken! });

    expect(await api.notes.get({ id })).toMatchObject({ sourceId, tags: [{ name: 'kadı' }] });
  });
});

describe('The Tag list', () => {
  async function library() {
    const { api, sourceId } = await scholarWithSource();
    const { id: other } = await api.sources.create({ type: 'archive', title: 'DH.MKT', author: 'BOA' });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Bir.', tags: ['naib', 'kadı'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'İki.', tags: ['kadı'] });
    await api.tags.setOnSource({ sourceId: other, names: ['Çorum', 'kadı'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Üç.', tags: ['Ilgaz'] });
    return api;
  }

  it('counts the Notes and the Sources carrying each Tag, A–Z by the Turkish alphabet', async () => {
    const api = await library();

    expect(await api.tags.list({ sort: 'name' })).toEqual([
      { id: expect.any(String), name: 'Çorum', noteCount: 0, sourceCount: 1 },
      { id: expect.any(String), name: 'Ilgaz', noteCount: 1, sourceCount: 0 },
      { id: expect.any(String), name: 'kadı', noteCount: 2, sourceCount: 1 },
      { id: expect.any(String), name: 'naib', noteCount: 1, sourceCount: 0 },
    ]);
  });

  it('puts the most used first, A–Z among equals (Çok kullanılan)', async () => {
    const api = await library();

    expect(names(await api.tags.list({ sort: 'usage' }))).toEqual(['kadı', 'Çorum', 'Ilgaz', 'naib']);
  });

  it('puts the last put on first, as many as asked (Ana sayfa)', async () => {
    const api = await library();

    // Çorum and kadı went on the second Source together: A–Z between them.
    expect(names(await api.tags.list({ sort: 'recent', limit: 3 }))).toEqual(['Ilgaz', 'Çorum', 'kadı']);
  });

  it("never shows another Library's Tags, even to a query that forgets to ask for its own", async () => {
    await library();
    const device = await t.signIn(scholarEmail());

    expect(await (await device.call()).tags.list({ sort: 'name' })).toEqual([]);
    // Row-level security alone (ADR-0006).
    const unscoped = await withLibrary(t.db, device.accountId, (tx) => tx.select().from(tag));
    expect(unscoped).toEqual([]);
  });
});

describe("A Source's Tags", () => {
  it('stay on the Source and are never written onto its Notes (ADR-0003)', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, excerpt: 'Kadı, naibini kendisi seçerdi.' });

    await api.tags.setOnSource({ sourceId, names: ['Ermeni meselesi', 'BOA'] });

    expect(names((await api.sources.get({ id: sourceId })).tags)).toEqual(['BOA', 'Ermeni meselesi']);
    expect((await api.notes.get({ id })).tags).toEqual([]);
    expect(await api.tags.list({ sort: 'name' })).toMatchObject([
      { name: 'BOA', noteCount: 0, sourceCount: 1 },
      { name: 'Ermeni meselesi', noteCount: 0, sourceCount: 1 },
    ]);
  });

  it("can be set only on this Library's Sources", async () => {
    const { sourceId } = await scholarWithSource();
    const stranger = await (await t.signIn(scholarEmail())).call();

    await expect(stranger.tags.setOnSource({ sourceId, names: ['kadı'] })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
