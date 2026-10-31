import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholarWithSource() {
  const api = await (await t.signIn(scholarEmail())).call();
  const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
  return { api, sourceId };
}

const names = (tags: { name: string }[]) => tags.map((tag) => tag.name);

describe('Renaming a Tag', () => {
  it('only corrects the spelling when the identity stays: no merge (#3, scenario 6)', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Cemiyet kuruldu.', tags: ['ittihat ve terakki'] });
    const [before] = await api.tags.list({ sort: 'name' });

    expect(await api.tags.rename({ id: before!.id, name: 'İttihat ve Terakki' })).toEqual({
      outcome: 'renamed',
      tag: { id: before!.id, name: 'İttihat ve Terakki' },
    });

    expect(await api.notes.get({ id })).toMatchObject({ tags: [{ id: before!.id, name: 'İttihat ve Terakki' }] });
  });

  it('takes a new identity with a new name: the old name is free for another Tag', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Kadı naibini seçerdi.', tags: ['naib'] });
    const [naib] = await api.tags.list({ sort: 'name' });

    await api.tags.rename({ id: naib!.id, name: 'Nâib' });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Başka.', tags: ['naib'] });

    expect(names((await api.notes.get({ id })).tags)).toEqual(['Nâib']);
    expect(names(await api.tags.list({ sort: 'name' }))).toEqual(['naib', 'Nâib']);
  });

  it("asks before taking another Tag's identity, and changes nothing meanwhile (#3, scenario 5)", async () => {
    const { api, sourceId } = await scholarWithSource();
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Bir.', tags: ['Cemiyet'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'İki.', tags: ['İttihat ve Terakki'] });
    const before = await api.tags.list({ sort: 'name' });
    const [cemiyet, ittihat] = before;

    expect(await api.tags.rename({ id: cemiyet!.id, name: 'ittihat ve terakki' })).toEqual({
      outcome: 'merge',
      into: { id: ittihat!.id, name: 'İttihat ve Terakki' },
    });

    expect(await api.tags.list({ sort: 'name' })).toEqual(before);
  });

  it("is only this Library's Tags", async () => {
    const { api, sourceId } = await scholarWithSource();
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Bir.', tags: ['kadı'] });
    const [kadi] = await api.tags.list({ sort: 'name' });
    const stranger = await (await t.signIn(scholarEmail())).call();

    await expect(stranger.tags.rename({ id: kadi!.id, name: 'Kadı' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(names(await api.tags.list({ sort: 'name' }))).toEqual(['kadı']);
  });
});

describe('Tag merge', () => {
  it('moves the Notes and Sources carrying the Tag to the other one, and the old name goes', async () => {
    const { api, sourceId } = await scholarWithSource();
    const note = uuidv7();
    await api.notes.create({ id: note, sourceId, comment: 'Bir.', tags: ['Cemiyet'] });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'İki.', tags: ['İttihat ve Terakki'] });
    await api.tags.setOnSource({ sourceId, names: ['Cemiyet'] });
    const [cemiyet, ittihat] = await api.tags.list({ sort: 'name' });

    expect(await api.tags.merge({ id: cemiyet!.id, intoId: ittihat!.id })).toEqual({
      id: ittihat!.id,
      name: 'İttihat ve Terakki',
    });

    expect((await api.notes.get({ id: note })).tags).toEqual([{ id: ittihat!.id, name: 'İttihat ve Terakki' }]);
    expect((await api.sources.get({ id: sourceId })).tags).toEqual([{ id: ittihat!.id, name: 'İttihat ve Terakki' }]);
    expect(await api.tags.list({ sort: 'name' })).toEqual([
      { id: ittihat!.id, name: 'İttihat ve Terakki', noteCount: 2, sourceCount: 1 },
    ]);
  });

  it('leaves a Note or a Source that carried both Tags with one link', async () => {
    const { api, sourceId } = await scholarWithSource();
    const both = uuidv7();
    await api.notes.create({ id: both, sourceId, comment: 'İkisi de.', tags: ['Cemiyet', 'İttihat ve Terakki'] });
    await api.tags.setOnSource({ sourceId, names: ['Cemiyet', 'İttihat ve Terakki'] });
    const [cemiyet, ittihat] = await api.tags.list({ sort: 'name' });

    await api.tags.merge({ id: cemiyet!.id, intoId: ittihat!.id });

    expect(names((await api.notes.get({ id: both })).tags)).toEqual(['İttihat ve Terakki']);
    expect(names((await api.sources.get({ id: sourceId })).tags)).toEqual(['İttihat ve Terakki']);
    expect(await api.tags.list({ sort: 'name' })).toMatchObject([{ noteCount: 1, sourceCount: 1 }]);
  });

  it('offers no Geri al', async () => {
    const { api, sourceId } = await scholarWithSource();
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Bir.', tags: ['Cemiyet', 'İttihat ve Terakki'] });
    const [cemiyet, ittihat] = await api.tags.list({ sort: 'name' });

    expect(await api.tags.merge({ id: cemiyet!.id, intoId: ittihat!.id })).not.toHaveProperty('undoToken');
  });

  it('refuses a Tag merged into itself', async () => {
    const { api, sourceId } = await scholarWithSource();
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Bir.', tags: ['kadı'] });
    const [kadi] = await api.tags.list({ sort: 'name' });

    await expect(api.tags.merge({ id: kadi!.id, intoId: kadi!.id })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  it("is only this Library's Tags, either way", async () => {
    const mine = await scholarWithSource();
    const theirs = await scholarWithSource();
    await mine.api.notes.create({ id: uuidv7(), sourceId: mine.sourceId, comment: 'Bir.', tags: ['kadı'] });
    await theirs.api.notes.create({ id: uuidv7(), sourceId: theirs.sourceId, comment: 'İki.', tags: ['naib'] });
    const [kadi] = await mine.api.tags.list({ sort: 'name' });
    const [naib] = await theirs.api.tags.list({ sort: 'name' });

    await expect(mine.api.tags.merge({ id: kadi!.id, intoId: naib!.id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(mine.api.tags.merge({ id: naib!.id, intoId: kadi!.id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(names(await mine.api.tags.list({ sort: 'name' }))).toEqual(['kadı']);
    expect(names(await theirs.api.tags.list({ sort: 'name' }))).toEqual(['naib']);
  });
});

describe('Deleting a Tag', () => {
  async function kadiInUse() {
    const { api, sourceId } = await scholarWithSource();
    const { id: other } = await api.sources.create({ type: 'archive', title: 'Şer‘iyye Sicilleri' });
    const notes = [uuidv7(), uuidv7(), uuidv7()];
    await api.notes.create({ id: notes[0]!, sourceId, comment: 'Bir.', tags: ['kadı', 'naib'] });
    await api.notes.create({ id: notes[1]!, sourceId: other, comment: 'İki.', tags: ['kadı'] });
    await api.notes.create({ id: notes[2]!, sourceId: other, comment: 'Üç.', tags: ['naib'] });
    await api.tags.setOnSource({ sourceId, names: ['kadı'] });
    await api.tags.setOnSource({ sourceId: other, names: ['kadı', 'Çorum'] });
    const kadi = (await api.tags.list({ sort: 'name' })).find((tag) => tag.name === 'kadı')!;
    return { api, sourceId, other, notes, kadi };
  }

  it('first tells how many Notes and Sources it comes off', async () => {
    const { api, kadi } = await kadiInUse();

    // Only the Notes carrying it themselves: a Source's Tag is not on its Notes (ADR-0003).
    expect(await api.tags.deleteImpact({ id: kadi.id })).toEqual({
      name: 'kadı',
      notes: 2,
      sources: 2,
      collections: 0,
    });
  });

  it('takes it off every Note and Source, the rest of their Tags staying', async () => {
    const { api, sourceId, notes, kadi } = await kadiInUse();

    expect(await api.tags.delete({ id: kadi.id })).toEqual({ undoToken: expect.any(String) });

    expect(names((await api.notes.get({ id: notes[0]! })).tags)).toEqual(['naib']);
    expect((await api.notes.get({ id: notes[1]! })).tags).toEqual([]);
    expect((await api.sources.get({ id: sourceId })).tags).toEqual([]);
    expect(names(await api.tags.list({ sort: 'name' }))).toEqual(['Çorum', 'naib']);
  });

  it('is taken back by Geri al with every link, under the same Tag', async () => {
    const { api, sourceId, other, notes, kadi } = await kadiInUse();
    const before = await api.tags.list({ sort: 'name' });
    const { undoToken } = await api.tags.delete({ id: kadi.id });

    await api.undo({ token: undoToken! });

    expect(await api.tags.list({ sort: 'name' })).toEqual(before);
    expect(names((await api.notes.get({ id: notes[0]! })).tags)).toEqual(['kadı', 'naib']);
    expect((await api.notes.get({ id: notes[1]! })).tags).toEqual([{ id: kadi.id, name: 'kadı' }]);
    expect(names((await api.sources.get({ id: sourceId })).tags)).toEqual(['kadı']);
    expect(names((await api.sources.get({ id: other })).tags)).toEqual(['Çorum', 'kadı']);
  });

  it('puts the links back on a Tag of that identity made again meanwhile', async () => {
    const { api, sourceId, notes, kadi } = await kadiInUse();
    const { undoToken } = await api.tags.delete({ id: kadi.id });
    await api.notes.create({ id: uuidv7(), sourceId, comment: 'Dört.', tags: ['Kadı'] });

    await api.undo({ token: undoToken! });

    expect(names((await api.notes.get({ id: notes[1]! })).tags)).toEqual(['Kadı']);
    expect(await api.tags.list({ sort: 'name' })).toMatchObject([
      { name: 'Çorum' },
      { name: 'Kadı', noteCount: 3, sourceCount: 2 },
      { name: 'naib' },
    ]);
  });

  it('changes nothing for a Tag already gone, or another Library’s', async () => {
    const { api, kadi } = await kadiInUse();
    const stranger = await (await t.signIn(scholarEmail())).call();

    expect(await stranger.tags.delete({ id: kadi.id })).toEqual({ undoToken: null });
    await expect(stranger.tags.deleteImpact({ id: kadi.id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await api.tags.deleteImpact({ id: kadi.id })).toMatchObject({ notes: 2, sources: 2 });

    await api.tags.delete({ id: kadi.id });
    expect(await api.tags.delete({ id: kadi.id })).toEqual({ undoToken: null });
  });
});
