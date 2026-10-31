import { describe, expect, it } from 'vitest';

import { type Operation, openOutbox } from '../index';
import { memoryStorage } from '../memory';
import { fakeServer } from './fakes';

const SOURCE = '01900000-0000-7000-8000-00000000000a';
// UUIDv7s in capture order.
const N1 = '01900000-0001-7000-8000-000000000001';
const N2 = '01900000-0002-7000-8000-000000000002';
const OTHER = '01900000-0000-7000-8000-00000000000b';

const capture = (id: string, excerpt: string): Operation => ({
  type: 'createNote',
  note: { id, sourceId: SOURCE, locator: null, excerpt },
});

// What the server refuses: a Note left without an Excerpt or a Comment.
const blank = '  ';

// Spec #40: "hiçbir not sessizce kaybolmaz".
describe('a Note the server refuses', () => {
  it('stays with its text as "gönderilemedi", while the Notes after it are sent', async () => {
    const server = fakeServer();
    const storage = memoryStorage();
    const outbox = await openOutbox({ storage, transport: server.transport });

    await outbox.apply(capture(N1, blank));
    await outbox.apply(capture(N2, 'iki'));
    await outbox.drain();

    expect(outbox.state().status.get(N1)).toBe('refused');
    expect(outbox.state().pending).toEqual([capture(N1, blank)]);
    expect(storage.rows).toHaveLength(1);
    expect(server.notes.get(N2)?.excerpt).toBe('iki');
    expect(outbox.state().waiting).toBe(1);
  });

  it('is sent again once the scholar edits it', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    await outbox.apply(capture(N1, blank));
    await outbox.drain();

    await outbox.apply({
      type: 'updateNote',
      id: N1,
      locator: 's. 4',
      excerpt: 'düzeltilmiş',
      comment: null,
      tags: [],
    });
    await outbox.drain();

    expect(server.notes.get(N1)).toMatchObject({ sourceId: SOURCE, locator: 's. 4', excerpt: 'düzeltilmiş' });
    expect(outbox.state().status.get(N1)).toBe('synced');
    expect(outbox.state().waiting).toBe(0);
  });

  it('is let go when the scholar deletes it, never reaching the server', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    await outbox.apply(capture(N1, blank));
    await outbox.drain();

    await outbox.apply({ type: 'deleteNote', id: N1 });
    await outbox.drain();

    expect(outbox.state().pending).toEqual([]);
    expect(outbox.state().waiting).toBe(0);
    expect(server.received.map((operation) => operation.type)).toEqual(['createNote']);
  });

  it("keeps a refused edit of a sent Note, holding back that Note's later edits, until it is edited again", async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    await outbox.apply(capture(N1, 'bir'));
    await outbox.apply(capture(N2, 'iki'));
    await outbox.drain();
    server.goOffline();

    await outbox.apply({ type: 'updateNote', id: N1, excerpt: blank });
    await outbox.apply({ type: 'updateNote', id: N1, locator: 's. 9' });
    await outbox.apply({ type: 'updateNote', id: N2, excerpt: 'iki, düzeltilmiş' });
    server.goOnline();
    await outbox.drain();

    expect(outbox.state().status.get(N1)).toBe('refused');
    expect(server.notes.get(N1)).toMatchObject({ locator: null, excerpt: 'bir', comment: null });
    expect(server.notes.get(N2)?.excerpt).toBe('iki, düzeltilmiş');

    await outbox.apply({ type: 'updateNote', id: N1, locator: 's. 10', excerpt: 'bir, yeniden', comment: 'yorum' });
    await outbox.drain();

    expect(server.notes.get(N1)).toMatchObject({ locator: 's. 10', excerpt: 'bir, yeniden', comment: 'yorum' });
    expect(outbox.state().status.get(N1)).toBe('synced');
    expect(outbox.state().waiting).toBe(0);
  });

  it('with a refused edit, is still moved and deleted as the scholar asks', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    await outbox.apply(capture(N1, 'bir'));
    await outbox.apply(capture(N2, 'iki'));
    await outbox.drain();
    await outbox.apply({ type: 'updateNote', id: N1, excerpt: blank });
    await outbox.apply({ type: 'updateNote', id: N2, excerpt: blank });
    await outbox.drain();

    // The move waits with the Note until the edit is fixed.
    await outbox.apply({ type: 'moveNote', id: N1, sourceId: OTHER });
    await outbox.apply({ type: 'updateNote', id: N1, excerpt: 'bir, düzeltilmiş' });
    await outbox.apply({ type: 'deleteNote', id: N2 });
    await outbox.drain();

    expect(server.notes.get(N1)).toMatchObject({ sourceId: OTHER, excerpt: 'bir, düzeltilmiş' });
    expect(server.notes.has(N2)).toBe(false);
    expect(outbox.state().waiting).toBe(0);
  });

  it('stays waiting across launches', async () => {
    const server = fakeServer();
    const storage = memoryStorage();
    const before = await openOutbox({ storage, transport: server.transport });
    await before.apply(capture(N1, blank));
    await before.drain();

    const after = await openOutbox({ storage, transport: server.transport });
    await after.drain();
    expect(after.state().status.get(N1)).toBe('refused');
    expect(storage.rows).toHaveLength(1);
  });
});
