import { describe, expect, it } from 'vitest';

import { type Operation, withPendingNotes } from '../index';

const SOURCE = '01900000-0000-7000-8000-00000000000a';
const OTHER = '01900000-0000-7000-8000-00000000000b';
const SAVED = '01900000-0001-7000-8000-000000000001';
const N2 = '01900000-0002-7000-8000-000000000002';
const N3 = '01900000-0003-7000-8000-000000000003';
const N4 = '01900000-0004-7000-8000-000000000004';

const saved = { id: SAVED, locator: 's. 20', locatorSort: [20], excerpt: 'Sunucudaki', comment: null };

const capture = (
  id: string,
  note: { locator?: string | null; excerpt?: string; comment?: string },
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
});
