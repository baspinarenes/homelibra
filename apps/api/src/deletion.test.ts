import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholarWithSource(title = 'Taşrada Kadı ve Naib') {
  const api = await (await t.signIn(scholarEmail())).call();
  const { id: sourceId } = await api.sources.create({ type: 'book', title });
  return { api, sourceId };
}

describe('Note deletion', () => {
  it('takes a doubly captured Note away at once, and Geri al brings it back as it was (#36, scenario 1)', async () => {
    const { api, sourceId } = await scholarWithSource();
    const first = uuidv7();
    const double = uuidv7();
    const excerpt = 'Kadı, naibini kendisi seçerdi.';
    await api.notes.create({ id: first, sourceId, locator: 's. 112', excerpt });
    await api.notes.create({ id: double, sourceId, locator: 's. 112', excerpt });
    await api.notes.update({ id: double, locatorSort: [112.5] });
    const before = await api.notes.list({ sourceId });

    const { undoToken } = await api.notes.delete({ id: double });

    expect(await api.notes.list({ sourceId })).toEqual([expect.objectContaining({ id: first })]);
    await expect(api.notes.get({ id: double })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await api.search.library({ query: 'naibini' })).toMatchObject({ notes: [{ id: first }] });

    await api.undo({ token: undoToken! });

    expect(await api.notes.list({ sourceId })).toEqual(before);
  });

  it('is idempotent, and an edit that reaches a deleted Note is ignored (the outbox sends in order)', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.' });

    expect(await api.notes.delete({ id })).toEqual({ undoToken: expect.any(String) });
    expect(await api.notes.delete({ id })).toEqual({ undoToken: null });
    await expect(api.notes.update({ id, comment: 'Sonradan gelen düzenleme.' })).resolves.toBeDefined();

    expect(await api.notes.list({ sourceId })).toEqual([]);
  });
});

/** When the Note came into its Source, as Organizing pass will read it (#53); no procedure shows it yet. */
async function enteredSourceAt(id: string) {
  const [row] = await t.owner.execute<{ at: string }>(
    sql`select entered_source_at::text as at from note where id = ${id}`,
  );
  return row ? new Date(row.at) : undefined;
}

describe('Note move', () => {
  it('carries the Note to another Source as it is; only when it entered its Source changes', async () => {
    const { api, sourceId: vakif } = await scholarWithSource("Osmanlı'da Vakıf");
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const id = uuidv7();
    await api.notes.create({ id, sourceId: vakif, locator: 's. 40', comment: 'Naibin maaşı vakıftan.' });
    await api.notes.update({ id, locatorSort: [41] });
    const note = await api.notes.get({ id });
    const captured = await enteredSourceAt(id);

    t.passTime(60 * 60 * 1000);
    await api.notes.move({ id, sourceId: kadi });

    expect(await api.notes.get({ id })).toEqual({ ...note, sourceId: kadi });
    expect(await api.notes.list({ sourceId: vakif })).toEqual([]);
    expect(await enteredSourceAt(id)).not.toEqual(captured);
  });

  it('goes back to its Source with Geri al, as if it had never moved', async () => {
    const { api, sourceId: vakif } = await scholarWithSource("Osmanlı'da Vakıf");
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const id = uuidv7();
    await api.notes.create({ id, sourceId: vakif, locator: 's. 40', comment: 'Naibin maaşı vakıftan.' });
    const captured = await enteredSourceAt(id);
    t.passTime(60 * 60 * 1000);
    const { undoToken } = await api.notes.move({ id, sourceId: kadi });

    await api.undo({ token: undoToken! });

    expect(await api.notes.get({ id })).toMatchObject({ sourceId: vakif });
    expect(await enteredSourceAt(id)).toEqual(captured);
  });

  it('says "kaynak yok" when the Source it goes to, or a new Note is for, is not there', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Naiplik bir tür kiralama mı?' });
    const { id: deleted } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı' });
    await api.sources.delete({ id: deleted });
    const { sourceId: anotherLibrarys } = await scholarWithSource();
    const sourceGone = { code: 'NOT_FOUND', message: 'SOURCE_NOT_FOUND' };

    for (const gone of [deleted, anotherLibrarys]) {
      await expect(api.notes.move({ id, sourceId: gone })).rejects.toMatchObject(sourceGone);
      await expect(api.notes.create({ id: uuidv7(), sourceId: gone, comment: 'Yeni.' })).rejects.toMatchObject(
        sourceGone,
      );
    }
    expect(await api.notes.get({ id })).toMatchObject({ sourceId });
  });

  it('is ignored for a Note already deleted, and changes nothing within the same Source', async () => {
    const { api, sourceId } = await scholarWithSource();
    const { id: other } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Naiplik bir tür kiralama mı?' });

    expect(await api.notes.move({ id, sourceId })).toEqual({ undoToken: null });
    await api.notes.delete({ id });
    expect(await api.notes.move({ id, sourceId: other })).toEqual({ undoToken: null });
    expect(await api.notes.list({ sourceId: other })).toEqual([]);
  });
});

describe('Source deletion', () => {
  it("merges two Sources opened twice: the short one's Notes are moved, then it is deleted (#36, scenario 4)", async () => {
    const { api, sourceId: short } = await scholarWithSource('Taşrada Kadı');
    const { id: full } = await api.sources.create({
      type: 'book',
      title: 'Taşrada Kadı ve Naib',
      author: 'İ. Ortaylı',
    });
    await api.notes.create({ id: uuidv7(), sourceId: full, locator: 's. 12', excerpt: 'Kadılık bir meslekti.' });
    const moved: string[] = [];
    for (const page of [3, 45, 45, 112, 7]) {
      const id = uuidv7();
      await api.notes.create({ id, sourceId: short, locator: `s. ${page}`, comment: `Not s. ${page}` });
      moved.push(id);
    }
    const before = await api.notes.list({ sourceId: short });

    for (const id of moved) await api.notes.move({ id, sourceId: full });
    expect(await api.notes.list({ sourceId: short })).toEqual([]);
    expect(await api.sources.delete({ id: short })).toEqual({ undoToken: expect.any(String) });

    expect((await api.sources.list({ sort: 'title' })).map((s) => s.id)).toEqual([full]);
    const merged = await api.notes.list({ sourceId: full });
    // The same Notes, still in Locator order and, at s. 45, in capture order.
    expect(merged.filter((n) => moved.includes(n.id))).toEqual(before);
    expect(merged.map((n) => n.locator)).toEqual(['s. 3', 's. 7', 's. 12', 's. 45', 's. 45', 's. 112']);
  });

  it('takes its Notes along, and Geri al brings back the Source and every Note with the same ids', async () => {
    const { api, sourceId } = await scholarWithSource();
    await api.sources.update({
      id: sourceId,
      author: 'İlber Ortaylı',
      date: { calendar: 'gregorian', year: 1994 },
      bibliographicNote: 'Ankara: TTK',
      fields: { publisher: 'Türk Tarih Kurumu' },
    });
    const ids = [uuidv7(), uuidv7(), uuidv7()];
    await api.notes.create({ id: ids[0]!, sourceId, locator: 's. 45', excerpt: 'Kadı, naibini kendisi seçerdi.' });
    await api.notes.create({ id: ids[1]!, sourceId, locator: 's. 45', comment: 'Naiplik bir tür kiralama mı?' });
    await api.notes.create({ id: ids[2]!, sourceId, comment: 'Genel değerlendirme.' });
    const source = await api.sources.get({ id: sourceId });
    const notes = await api.notes.list({ sourceId });
    const entered = await Promise.all(ids.map(enteredSourceAt));

    const { undoToken } = await api.sources.delete({ id: sourceId });

    await expect(api.sources.get({ id: sourceId })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    for (const id of ids) await expect(api.notes.get({ id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await api.sources.home()).toEqual({ sourceCount: 0 });
    expect(await api.sources.lastNoted()).toBeNull();
    expect(await api.search.library({ query: 'naibini' })).toMatchObject({ sources: [], notes: [] });

    await api.undo({ token: undoToken! });

    expect(await api.sources.get({ id: sourceId })).toEqual(source);
    expect(await api.notes.list({ sourceId })).toEqual(notes);
    expect(await Promise.all(ids.map(enteredSourceAt))).toEqual(entered);
    expect(await api.search.library({ query: 'naibini' })).toMatchObject({ notes: [{ id: ids[0] }] });
  });

  it('is idempotent', async () => {
    const { api, sourceId } = await scholarWithSource();

    await api.sources.delete({ id: sourceId });

    expect(await api.sources.delete({ id: sourceId })).toEqual({ undoToken: null });
  });

  it("cannot reach another Library's Source", async () => {
    const { api, sourceId } = await scholarWithSource();
    const stranger = await (await t.signIn(scholarEmail())).call();

    expect(await stranger.sources.delete({ id: sourceId })).toEqual({ undoToken: null });

    expect(await api.sources.get({ id: sourceId })).toMatchObject({ id: sourceId });
  });
});

describe('Geri al', () => {
  it('changes nothing when sent again after it worked', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Naiplik bir tür kiralama mı?' });
    const { undoToken } = await api.notes.delete({ id });

    await api.undo({ token: undoToken! });
    await api.undo({ token: undoToken! });

    expect(await api.notes.list({ sourceId })).toEqual([expect.objectContaining({ id })]);
  });

  it('is refused once its few minutes on the server are over', async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Naiplik bir tür kiralama mı?' });
    const { undoToken } = await api.notes.delete({ id });

    t.passTime(5 * 60 * 1000);

    await expect(api.undo({ token: undoToken! })).rejects.toMatchObject({ code: 'NOT_FOUND', message: 'UNDO_EXPIRED' });
    expect(await api.notes.list({ sourceId })).toEqual([]);
  });

  it('is refused when what it brings back has nowhere to go, and changes nothing', async () => {
    const { api, sourceId: vakif } = await scholarWithSource("Osmanlı'da Vakıf");
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const deleted = uuidv7();
    const moved = uuidv7();
    await api.notes.create({ id: deleted, sourceId: vakif, comment: 'Silinecek.' });
    await api.notes.create({ id: moved, sourceId: vakif, comment: 'Taşınacak.' });
    const { undoToken: undoDelete } = await api.notes.delete({ id: deleted });
    const { undoToken: undoMove } = await api.notes.move({ id: moved, sourceId: kadi });
    await api.sources.delete({ id: vakif });
    const refused = { code: 'CONFLICT', message: 'UNDO_CONFLICT' };

    await expect(api.undo({ token: undoDelete! })).rejects.toMatchObject(refused);
    await expect(api.undo({ token: undoMove! })).rejects.toMatchObject(refused);

    await expect(api.notes.get({ id: deleted })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await api.notes.get({ id: moved })).toMatchObject({ sourceId: kadi });
  });

  it("cannot take back another Library's operation", async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Benim.' });
    const { undoToken } = await api.notes.delete({ id });
    const stranger = await (await t.signIn(scholarEmail())).call();

    await expect(stranger.undo({ token: undoToken! })).rejects.toMatchObject({ message: 'UNDO_EXPIRED' });
    expect(await api.notes.list({ sourceId })).toEqual([]);
  });
});

describe('the clean-up job', () => {
  it("deletes a Geri al's record once its time is over, and only then", async () => {
    const { api, sourceId } = await scholarWithSource();
    const id = uuidv7();
    await api.notes.create({ id, sourceId, comment: 'Naiplik bir tür kiralama mı?' });
    const { undoToken } = await api.notes.delete({ id });
    const record = sql`select count(*)::int as n from undo_record where id = ${undoToken}`;
    const left = async () => (await t.owner.execute<{ n: number }>(record))[0]?.n;

    await t.api.jobs.deleteExpiredUndoRecords(new Date(Date.now() + 4 * 60 * 1000));
    expect(await left()).toBe(1);

    await t.api.jobs.deleteExpiredUndoRecords(new Date(Date.now() + 5 * 60 * 1000));
    expect(await left()).toBe(0);
  });
});
