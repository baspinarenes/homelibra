import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}

const names = (tags: { name: string }[]) => tags.map((tag) => tag.name);

/** "İttihat ve Terakki", using "Cemiyet" (a Note carries it too) and "taslak" (nothing else uses it). */
async function collectionWithTags() {
  const api = await scholar();
  const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Jön Türkler' });
  const noteId = uuidv7();
  await api.notes.create({ id: noteId, sourceId, locator: 's. 4', excerpt: 'Selanik şubesi.', tags: ['Cemiyet'] });
  const { id } = await api.collections.create({
    name: 'İttihat ve Terakki',
    tags: ['Cemiyet', 'taslak'],
    includeSourceNotes: false,
  });
  return { api, id, sourceId, noteId };
}

describe('Dosyayı sil (#36)', () => {
  it('takes the Collection away at once, without touching its Notes or a Tag still in use', async () => {
    const { api, id, sourceId } = await collectionWithTags();

    await api.collections.delete({ id });

    expect(await api.collections.list()).toEqual([]);
    await expect(api.collections.view({ id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect((await api.notes.list({ sourceId })).map((n) => n.excerpt)).toEqual(['Selanik şubesi.']);
    expect(names(await api.tags.list({ sort: 'name' }))).toEqual(['Cemiyet']);
  });

  it('Geri al brings it back as it was, with the Tag only it kept', async () => {
    const { api, id } = await collectionWithTags();

    const { undoToken } = await api.collections.delete({ id });
    await api.undo({ token: undoToken! });

    const view = await api.collections.view({ id });
    expect(view).toMatchObject({ id, name: 'İttihat ve Terakki', includeSourceNotes: false, noteCount: 1 });
    expect(names(view.tags)).toEqual(['Cemiyet', 'taslak']);
    expect(names(await api.tags.list({ sort: 'name' }))).toEqual(['Cemiyet', 'taslak']);
  });

  it('is only its own Library’s', async () => {
    const { api, id } = await collectionWithTags();
    const theirs = await scholar();

    await theirs.collections.delete({ id });

    expect((await api.collections.view({ id })).name).toBe('İttihat ve Terakki');
  });

  it('asked again for a Collection already gone, changes nothing and offers no Geri al', async () => {
    const { api, id } = await collectionWithTags();
    await api.collections.delete({ id });

    expect(await api.collections.delete({ id })).toEqual({ undoToken: null });
  });
});

describe('A Collection whose Tags are all gone (#36)', () => {
  it('stays, empty, when its last Tag is deleted', async () => {
    const api = await scholar();
    const { id } = await api.collections.create({ name: 'Plan', tags: ['ileride'] });
    const [tag] = await api.tags.list({ sort: 'name' });

    await api.tags.delete({ id: tag!.id });

    expect(await api.collections.list()).toEqual([{ id, name: 'Plan', tags: [], noteCount: 0 }]);
  });
});
