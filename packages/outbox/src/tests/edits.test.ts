import { describe, expect, it } from 'vitest';

import { type Operation, openOutbox } from '../index';
import { memoryStorage } from '../memory';
import { fakeServer } from './fakes';

const SOURCE = '01900000-0000-7000-8000-00000000000a';
const OTHER = '01900000-0000-7000-8000-00000000000b';
// UUIDv7s in capture order.
const N1 = '01900000-0001-7000-8000-000000000001';
const N2 = '01900000-0002-7000-8000-000000000002';
const N3 = '01900000-0003-7000-8000-000000000003';

const noteId = (operation: Operation) => (operation.type === 'createNote' ? operation.note.id : operation.id);

const capture = (id: string, excerpt: string, sourceId = SOURCE): Operation => ({
  type: 'createNote',
  note: { id, sourceId, locator: null, excerpt },
});

/** An outbox whose Notes N1 and N2 the server already has. */
async function withSentNotes() {
  const server = fakeServer();
  const storage = memoryStorage();
  const outbox = await openOutbox({ storage, transport: server.transport });
  await outbox.apply(capture(N1, 'bir'));
  await outbox.apply(capture(N2, 'iki'));
  await outbox.drain();
  server.received.length = 0;
  return { server, storage, outbox };
}

describe('editing, moving and deleting through the outbox', () => {
  it('sends edits, moves and deletions in the order they were made', async () => {
    const { server, outbox } = await withSentNotes();
    server.goOffline();

    await outbox.apply({ type: 'updateNote', id: N1, excerpt: 'bir, düzeltilmiş' });
    await outbox.apply({ type: 'moveNote', id: N1, sourceId: OTHER });
    await outbox.apply({ type: 'deleteNote', id: N2 });
    expect(outbox.state().status.get(N1)).toBe('queued');

    server.goOnline();
    await outbox.drain();

    expect(server.received.map((operation) => operation.type)).toEqual(['updateNote', 'moveNote', 'deleteNote']);
    expect(server.notes.get(N1)).toMatchObject({ sourceId: OTHER, excerpt: 'bir, düzeltilmiş' });
    expect(server.notes.has(N2)).toBe(false);
    expect(outbox.state().waiting).toBe(0);
  });

  it('drops a Note never sent from the queue when it is deleted, and Geri al puts it back (#36, scenario 5)', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    server.goOffline();
    await outbox.apply(capture(N1, 'bir'));
    await outbox.apply(capture(N2, 'iki, yazım hatalı çift'));
    await outbox.apply({ type: 'updateNote', id: N2, excerpt: 'iki, yine hatalı' });
    await outbox.apply(capture(N3, 'üç'));

    const { undo } = await outbox.apply({ type: 'deleteNote', id: N2 });
    expect(outbox.state().waiting).toBe(2);

    server.goOnline();
    await outbox.drain();
    expect(server.received.map(noteId)).toEqual([N1, N3]);
    expect(server.notes.has(N2)).toBe(false);

    // Geri al: back in the queue with its edit, and sent.
    await undo?.();
    await outbox.drain();
    expect(server.notes.get(N2)?.excerpt).toBe('iki, yine hatalı');
  });

  it("puts the deletion of a Note being sent behind the Note's own sending", async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    const release = server.slowDown();
    await outbox.apply(capture(N1, 'bir'));
    expect(outbox.state().status.get(N1)).toBe('sending');

    await outbox.apply({ type: 'deleteNote', id: N1 });
    release();
    await outbox.drain();

    expect(server.received.map((operation) => operation.type)).toEqual(['createNote', 'deleteNote']);
    expect(server.notes.has(N1)).toBe(false);
  });

  it('queues the deletion of a sent Note; Geri al takes it out of the queue while it waits', async () => {
    const { server, outbox } = await withSentNotes();
    server.goOffline();

    const { undo } = await outbox.apply({ type: 'deleteNote', id: N1 });
    expect(outbox.state().pending).toEqual([{ type: 'deleteNote', id: N1 }]);
    await undo?.();

    server.goOnline();
    await outbox.drain();
    expect(server.received).toEqual([]);
    expect(server.notes.has(N1)).toBe(true);
  });

  it("brings a sent deletion or move back through the server's Geri al", async () => {
    const { server, outbox } = await withSentNotes();

    const deleted = await outbox.apply({ type: 'deleteNote', id: N1 });
    const moved = await outbox.apply({ type: 'moveNote', id: N2, sourceId: OTHER });
    await outbox.drain();
    expect(server.notes.has(N1)).toBe(false);
    expect(server.notes.get(N2)?.sourceId).toBe(OTHER);

    await deleted.undo?.();
    await moved.undo?.();
    expect(server.notes.has(N1)).toBe(true);
    expect(server.notes.get(N2)?.sourceId).toBe(SOURCE);
  });

  it('keeps Notes whose Source was deleted elsewhere as "Kaynağı silinmiş" until another Source is chosen (#36, scenario 6)', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    server.goOffline();
    await outbox.apply(capture(N1, 'bir'));
    await outbox.apply({ type: 'updateNote', id: N1, excerpt: 'bir, düzeltilmiş' });
    await outbox.apply(capture(N2, 'iki'));
    await outbox.apply(capture(N3, 'başka kaynakta', OTHER));
    // Meanwhile the fonds is deleted on the web.
    server.deleteSource(SOURCE);

    server.goOnline();
    await outbox.drain();

    expect([N1, N2].map((id) => outbox.state().status.get(id))).toEqual(['sourceGone', 'sourceGone']);
    // They hold back only their own operations: the edit waits, the other Source's Note went.
    expect(server.received.map((operation) => operation.type)).toEqual(['createNote', 'createNote', 'createNote']);
    expect(server.notes.has(N3)).toBe(true);
    expect(outbox.state().waiting).toBe(2);

    // A new Source in the Kaynak field: the Note goes there, then its edit.
    const { undo } = await outbox.apply({ type: 'moveNote', id: N1, sourceId: OTHER });
    await outbox.drain();
    expect(undo).toBeNull();
    expect(server.notes.get(N1)).toMatchObject({ sourceId: OTHER, excerpt: 'bir, düzeltilmiş' });
    expect(outbox.state().status.get(N1)).toBe('synced');
    expect(outbox.state().status.get(N2)).toBe('sourceGone');

    // Or deleted: it leaves the queue without reaching the server.
    await outbox.apply({ type: 'deleteNote', id: N2 });
    await outbox.drain();
    expect(server.notes.has(N2)).toBe(false);
    expect(outbox.state().waiting).toBe(0);
  });

  it('keeps a Note moved to a Source deleted meanwhile as "Kaynağı silinmiş", where it can be deleted', async () => {
    const { server, outbox } = await withSentNotes();
    server.goOffline();
    await outbox.apply({ type: 'moveNote', id: N1, sourceId: OTHER });
    server.deleteSource(OTHER);
    server.goOnline();
    await outbox.drain();
    expect(outbox.state().status.get(N1)).toBe('sourceGone');
    expect(server.notes.get(N1)?.sourceId).toBe(SOURCE);

    await outbox.apply({ type: 'deleteNote', id: N1 });
    await outbox.drain();
    expect(server.notes.has(N1)).toBe(false);
    expect(server.received.map((operation) => operation.type)).toEqual(['moveNote', 'deleteNote']);
  });

  it('makes a queued Comment its own Note when its Excerpt took another meanwhile, and goes on', async () => {
    const { server, outbox } = await withSentNotes();
    server.goOffline();
    const ownNote = { id: N3, sourceId: SOURCE, locator: null };
    await outbox.apply({ type: 'attachComment', id: N1, comment: 'telefondaki yorum', ownNote });
    await outbox.apply({ type: 'updateNote', id: N2, excerpt: 'iki, düzeltilmiş' });
    // Another device got there first.
    server.notes.get(N1)!.comment = 'webdeki yorum';

    server.goOnline();
    await outbox.drain();
    expect(server.notes.get(N1)?.comment).toBe('webdeki yorum');
    expect(server.notes.get(N3)).toMatchObject({ sourceId: SOURCE, excerpt: null, comment: 'telefondaki yorum' });
    expect(server.notes.get(N2)?.excerpt).toBe('iki, düzeltilmiş');

    // Geri al of the attaching, sent after: the Comment's Note is there already.
    await outbox.apply({ type: 'detachComment', id: N1, commentNoteId: N3 });
    await outbox.drain();
    expect(server.notes.get(N1)?.comment).toBe('webdeki yorum');
    expect(outbox.state().waiting).toBe(0);
  });

  it('lets an operation the server refuses for good leave the queue rather than hold it', async () => {
    const { server, outbox } = await withSentNotes();
    server.deleteSource(SOURCE);
    await outbox.apply({ type: 'detachComment', id: N1, commentNoteId: N3 });
    await outbox.apply(capture(N3, 'üç', OTHER));
    await outbox.drain();

    expect(outbox.state().pending).toEqual([]);
    expect(server.notes.has(N3)).toBe(true);
  });

  it('keeps a lost Note waiting across launches', async () => {
    const server = fakeServer();
    const storage = memoryStorage();
    server.deleteSource(SOURCE);
    const before = await openOutbox({ storage, transport: server.transport });
    await before.apply(capture(N1, 'bir'));
    await before.drain();

    const after = await openOutbox({ storage, transport: server.transport });
    await after.drain();
    expect(after.state().status.get(N1)).toBe('sourceGone');
    expect(storage.rows).toHaveLength(1);
  });
});
