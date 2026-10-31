import { describe, expect, it } from 'vitest';

import { type Operation, openOutbox } from '../index';
import { fakeServer, memoryStorage } from './fakes';

const SOURCE = '01900000-0000-7000-8000-00000000000a';
// UUIDv7s in capture order.
const N1 = '01900000-0001-7000-8000-000000000001';
const N2 = '01900000-0002-7000-8000-000000000002';
const N3 = '01900000-0003-7000-8000-000000000003';

const noteId = (operation: Operation) => (operation.type === 'createNote' ? operation.note.id : operation.id);

const capture = (id: string, excerpt: string, locator: string | null = null): Operation => ({
  type: 'createNote',
  note: { id, sourceId: SOURCE, locator, excerpt },
});

describe('outbox', () => {
  it('sends an applied operation and marks its Note synced once the server confirms', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });

    await outbox.apply(capture(N1, 'İlk alıntı'));
    await outbox.drain();

    expect(server.notes.get(N1)?.excerpt).toBe('İlk alıntı');
    expect(outbox.state().status.get(N1)).toBe('synced');
    expect(outbox.state().waiting).toBe(0);
  });

  it('keeps Notes captured offline and sends them in capture order when the connection returns', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    server.goOffline();

    await outbox.apply(capture(N1, 'bir'));
    await outbox.apply(capture(N2, 'iki'));
    await outbox.apply(capture(N3, 'üç'));
    await outbox.drain();

    expect(server.notes.size).toBe(0);
    expect(outbox.state().waiting).toBe(3);
    expect([N1, N2, N3].map((id) => outbox.state().status.get(id))).toEqual(['queued', 'queued', 'queued']);

    server.goOnline();
    await outbox.drain();

    expect(server.received.map(noteId)).toEqual([N1, N2, N3]);
    expect(outbox.state().waiting).toBe(0);
  });

  it('holds every later operation while one fails, and sends them after it, in order', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    const release = server.slowDown();
    await outbox.apply(capture(N1, 'bir'));
    server.goOffline();
    await outbox.apply(capture(N2, 'iki'));
    release();
    await outbox.drain();

    // N1 failed at the head: N2 never went out ahead of it.
    expect(server.received).toEqual([]);
    expect(outbox.state().pending.map(noteId)).toEqual([N1, N2]);

    server.goOnline();
    await outbox.drain();
    expect(server.received.map(noteId)).toEqual([N1, N2]);
  });

  it('makes one Note when the server saved it but the reply was lost and it is sent again', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    server.cutRepliesOff();

    await outbox.apply(capture(N1, 'bir'));
    await outbox.drain();
    // Not confirmed, so not synced: it waits to be sent again.
    expect(outbox.state().status.get(N1)).toBe('queued');

    server.goOnline();
    await outbox.drain();

    // Sent more than once, and only ever this Note.
    expect(server.received.length).toBeGreaterThan(1);
    expect(new Set(server.received.map(noteId))).toEqual(new Set([N1]));
    expect(server.notes.size).toBe(1);
    expect(outbox.state().status.get(N1)).toBe('synced');
  });

  it('moves a Note from queued to sending to synced', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    const seen: (string | undefined)[] = [];
    outbox.subscribe(() => {
      const status = outbox.state().status.get(N1);
      if (status !== seen.at(-1)) seen.push(status);
    });
    const release = server.slowDown();

    await outbox.apply(capture(N1, 'bir'));
    expect(outbox.state().status.get(N1)).toBe('sending');
    release();
    await outbox.drain();

    expect(seen).toEqual(['queued', 'sending', 'synced']);
  });

  it('sends what an earlier launch left waiting', async () => {
    const server = fakeServer();
    const storage = memoryStorage();
    server.goOffline();
    const before = await openOutbox({ storage, transport: server.transport });
    await before.apply(capture(N1, 'bir'));
    await before.apply(capture(N2, 'iki'));

    // The app is closed and opened again, now online.
    server.goOnline();
    const after = await openOutbox({ storage, transport: server.transport });
    expect(after.state().waiting).toBe(2);
    await after.drain();

    expect(server.received.map(noteId)).toEqual([N1, N2]);
    expect(storage.rows).toEqual([]);
  });

  it('sends an operation applied during a send after it, without a second drain', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    const release = server.slowDown();

    await outbox.apply(capture(N1, 'bir'));
    await outbox.apply({ type: 'attachComment', id: N1, comment: 'yorum' });
    release();
    await outbox.drain();

    expect(server.received.map((operation) => operation.type)).toEqual(['createNote', 'attachComment']);
    expect(server.notes.get(N1)?.comment).toBe('yorum');
    // Both operations are about the same Note: one Note was waiting, not two.
    expect(outbox.state().status.get(N1)).toBe('synced');
  });

  it('counts the Notes waiting, not the operations', async () => {
    const server = fakeServer();
    const outbox = await openOutbox({ storage: memoryStorage(), transport: server.transport });
    server.goOffline();

    await outbox.apply(capture(N1, 'bir'));
    await outbox.apply({ type: 'attachComment', id: N1, comment: 'yorum' });
    await outbox.apply(capture(N2, 'iki'));

    expect(outbox.state().waiting).toBe(2);
  });
});
