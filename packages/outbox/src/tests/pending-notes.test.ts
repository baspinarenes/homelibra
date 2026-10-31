import { describe, expect, it } from 'vitest';

import { type Operation, pendingNote, withPendingNotes } from '../index';

const SOURCE = '01900000-0000-7000-8000-00000000000a';
const OTHER = '01900000-0000-7000-8000-00000000000b';
const SAVED = '01900000-0001-7000-8000-000000000001';
const N2 = '01900000-0002-7000-8000-000000000002';
const N3 = '01900000-0003-7000-8000-000000000003';
const N4 = '01900000-0004-7000-8000-000000000004';

const saved = { id: SAVED, locator: 's. 20', locatorSort: [20], excerpt: 'Sunucudaki', comment: null, tags: [] };

const capture = (
  id: string,
  note: { locator?: string | null; excerpt?: string; comment?: string; tags?: string[] },
  sourceId = SOURCE,
) => ({ type: 'createNote', note: { id, sourceId, ...note } }) satisfies Operation;

describe('withPendingNotes', () => {
  it("lays a Source's waiting Notes over its list, in Locator order", () => {
    const notes = withPendingNotes(
      SOURCE,
      [saved],
      [capture(N2, { locator: 's. 31', excerpt: 'otuz bir' }), capture(N3, { locator: 's. 5', excerpt: 'beş' })],
    );

    expect(notes.map((note) => [note.locator, note.excerpt])).toEqual([
      ['s. 5', 'beş'],
      ['s. 20', 'Sunucudaki'],
      ['s. 31', 'otuz bir'],
    ]);
  });

  it('keeps them as the server will: trimmed, a blank Locator Konumsuz', () => {
    const [note] = withPendingNotes(SOURCE, [], [capture(N2, { locator: '  ', excerpt: '  alıntı \n' })]);

    expect(note).toMatchObject({ locator: null, locatorSort: null, excerpt: 'alıntı', comment: null });
  });

  it("leaves out another Source's Notes", () => {
    expect(withPendingNotes(SOURCE, [saved], [capture(N2, { excerpt: 'başka' }, OTHER)])).toEqual([saved]);
  });

  it('shows a Note once when the list already has it', () => {
    const sent = capture(SAVED, { locator: 's. 20', excerpt: 'Sunucudaki' });

    expect(withPendingNotes(SOURCE, [saved], [sent])).toEqual([saved]);
  });

  it('shows a waiting Comment on its Excerpt, and Geri al splitting it off again', () => {
    const attached = withPendingNotes(
      SOURCE,
      [saved],
      [capture(N2, { locator: 's. 9', excerpt: 'dokuz' }), { type: 'attachComment', id: N2, comment: 'yorumum' }],
    );
    expect(attached.find((note) => note.id === N2)?.comment).toBe('yorumum');

    const split = withPendingNotes(
      SOURCE,
      [saved],
      [
        { type: 'attachComment', id: SAVED, comment: 'yorumum' },
        { type: 'detachComment', id: SAVED, commentNoteId: N4 },
      ],
    );
    expect(split.map((note) => [note.id, note.excerpt, note.comment])).toEqual([
      [SAVED, 'Sunucudaki', null],
      [N4, null, 'yorumum'],
    ]);
  });

  it("shows a waiting Note's Tags as the server will keep them: no #, once per identity", () => {
    const [note] = withPendingNotes(
      SOURCE,
      [],
      [capture(N2, { excerpt: 'alıntı', tags: ['#Hilâfet', 'hilâfet', 'Selanik'] })],
    );

    expect(note?.tags).toEqual([{ name: 'Hilâfet' }, { name: 'Selanik' }]);
  });

  it("adds the Tags chosen for a waiting Comment to its Excerpt's own", () => {
    const [note] = withPendingNotes(
      SOURCE,
      [],
      [
        capture(N2, { excerpt: 'alıntı', tags: ['kadı'] }),
        { type: 'attachComment', id: N2, comment: 'yorumum', tags: ['Kadı', 'naib'] },
      ],
    );

    expect(note?.tags).toEqual([{ name: 'kadı' }, { name: 'naib' }]);
  });

  it('shows a waiting edit as the server will keep it, its sort value derived again', () => {
    const [note] = withPendingNotes(
      SOURCE,
      [saved],
      [{ type: 'updateNote', id: SAVED, locator: ' s. 7 ', excerpt: 'düzeltilmiş ', tags: ['kadı'] }],
    );

    expect(note).toMatchObject({
      locator: 's. 7',
      locatorSort: [7],
      excerpt: 'düzeltilmiş',
      comment: null,
      tags: [{ name: 'kadı' }],
    });
  });

  it('skips a waiting edit that would leave a Note without text, as the server will refuse it', () => {
    const [note] = withPendingNotes(
      SOURCE,
      [saved],
      [{ type: 'updateNote', id: SAVED, locator: 's. 21', excerpt: ' ', comment: null }],
    );

    expect(note).toEqual(saved);
  });

  it('takes a waiting deletion off the list at once', () => {
    expect(withPendingNotes(SOURCE, [saved], [{ type: 'deleteNote', id: SAVED }])).toEqual([]);
  });

  it('moves a Note waiting to move from its Source to the other one', () => {
    const moved = { type: 'moveNote', id: SAVED, sourceId: OTHER } satisfies Operation;

    expect(withPendingNotes(SOURCE, [saved], [moved])).toEqual([]);
    // The other Source learns of it from the lists the phone keeps.
    expect(withPendingNotes(OTHER, [], [moved], [{ ...saved, sourceId: SOURCE }])).toEqual([saved]);
  });
});

describe('pendingNote', () => {
  it('finds a Note never sent, with its waiting edits and its Source', () => {
    const note = pendingNote(
      N2,
      [capture(N2, { excerpt: 'alıntı' }), { type: 'updateNote', id: N2, comment: 'yorum' }],
      [],
    );

    expect(note).toMatchObject({ id: N2, sourceId: SOURCE, excerpt: 'alıntı', comment: 'yorum' });
  });

  it('finds a sent Note among the ones the phone knows, after its waiting move', () => {
    const note = pendingNote(
      SAVED,
      [{ type: 'moveNote', id: SAVED, sourceId: OTHER }],
      [{ ...saved, sourceId: SOURCE }],
    );

    expect(note).toMatchObject({ id: SAVED, sourceId: OTHER, excerpt: 'Sunucudaki' });
  });

  it('finds nothing once the Note is deleted, or when the phone never saw it', () => {
    expect(pendingNote(SAVED, [{ type: 'deleteNote', id: SAVED }], [{ ...saved, sourceId: SOURCE }])).toBeNull();
    expect(pendingNote(N3, [], [{ ...saved, sourceId: SOURCE }])).toBeNull();
  });
});
