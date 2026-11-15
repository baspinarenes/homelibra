import { type Operation, openOutbox, type Reply, type Transport } from '@homelibra/outbox';
import { memoryStorage } from '@homelibra/outbox/memory';
import { describe, expect, it } from 'vitest';

import { lostNotes, shownLostNote } from './lost-notes';

const GONE = '01900000-0000-7000-8000-00000000000a';
const LIVE = '01900000-0000-7000-8000-00000000000b';
// UUIDv7s in capture order.
const N1 = '01900000-0001-7000-8000-000000000001';
const N2 = '01900000-0002-7000-8000-000000000002';
const N3 = '01900000-0003-7000-8000-000000000003';

/** The server as the lost Notes meet it: GONE was deleted on the web, every other Source is there. */
const server: Transport = {
  async send(operation: Operation): Promise<Reply> {
    const sourceId =
      operation.type === 'createNote'
        ? operation.note.sourceId
        : operation.type === 'moveNote'
          ? operation.sourceId
          : null;
    return sourceId === GONE ? { outcome: 'sourceGone' } : { outcome: 'done' };
  },
  async undo() {},
};

const capture = (id: string, excerpt: string, sourceId = GONE): Operation => ({
  type: 'createNote',
  note: { id, sourceId, locator: 's. 4', excerpt },
});

/** An outbox holding N1 and N2, captured for GONE, and N3 sent to LIVE. */
async function withLostNotes() {
  const outbox = await openOutbox({ storage: memoryStorage(), transport: server });
  await outbox.apply(capture(N1, 'bir'));
  await outbox.apply(capture(N2, 'iki'));
  await outbox.apply(capture(N3, 'üç', LIVE));
  await outbox.drain();
  return outbox;
}

describe('lostNotes', () => {
  it('lists the Notes whose Source was deleted while they waited, with their text, and not the others', async () => {
    const outbox = await withLostNotes();
    expect(lostNotes(outbox.state(), [])).toEqual([
      expect.objectContaining({ id: N1, excerpt: 'bir', locator: 's. 4' }),
      expect.objectContaining({ id: N2, excerpt: 'iki' }),
    ]);
  });

  it('lets a Note go once a new Source is chosen for it, keeping the others', async () => {
    const outbox = await withLostNotes();
    expect(lostNotes(outbox.state(), []).map((note) => note.id)).toEqual([N1, N2]);
    await outbox.apply({ type: 'moveNote', id: N1, sourceId: LIVE });
    await outbox.drain();
    expect(lostNotes(outbox.state(), []).map((note) => note.id)).toEqual([N2]);
  });

  it('lets a Note go once it is deleted, down to none', async () => {
    const outbox = await withLostNotes();
    expect(lostNotes(outbox.state(), []).map((note) => note.id)).toEqual([N1, N2]);
    await outbox.apply({ type: 'deleteNote', id: N1 });
    expect(lostNotes(outbox.state(), []).map((note) => note.id)).toEqual([N2]);
    await outbox.apply({ type: 'deleteNote', id: N2 });
    await outbox.drain();
    expect(lostNotes(outbox.state(), [])).toEqual([]);
  });
});

describe('shownLostNote', () => {
  it('is the lost Note the panel was opened on, and none while it is closed', async () => {
    const outbox = await withLostNotes();
    const lost = lostNotes(outbox.state(), []);
    expect(shownLostNote(N2, lost)).toMatchObject({ id: N2, excerpt: 'iki' });
    expect(shownLostNote(null, lost)).toBeNull();
  });

  it('closes the panel once its Note is no longer lost: moved to a new Source, or deleted', async () => {
    const outbox = await withLostNotes();
    expect(shownLostNote(N1, lostNotes(outbox.state(), []))).toMatchObject({ id: N1 });
    await outbox.apply({ type: 'moveNote', id: N1, sourceId: LIVE });
    await outbox.drain();
    expect(shownLostNote(N1, lostNotes(outbox.state(), []))).toBeNull();

    expect(shownLostNote(N2, lostNotes(outbox.state(), []))).toMatchObject({ id: N2 });
    await outbox.apply({ type: 'deleteNote', id: N2 });
    expect(shownLostNote(N2, lostNotes(outbox.state(), []))).toBeNull();
  });
});
