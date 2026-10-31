import { type Operation, openOutbox, type Transport } from '@homelibra/outbox';
import { memoryStorage } from '@homelibra/outbox/memory';
import { trpcTransport } from '@homelibra/outbox/trpc';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

// The outbox against the real router and Postgres, through the Transport and
// the tRPC client the phone has (ADR-0008). Each reply rule of the outbox's
// fakeServer (packages/outbox/src/tests/fakes.ts) is checked here.

const t = testApi();

/** A scholar's phone with an outbox, and a Source in the Library. */
async function phone({ transport }: { transport?: (real: Transport) => Transport } = {}) {
  const device = await t.signIn(scholarEmail());
  const real = trpcTransport(device.client());
  const outbox = await openOutbox({ storage: memoryStorage(), transport: transport?.(real) ?? real });
  const server = await device.call();
  const { id: sourceId } = await server.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
  const sent = async (operation: Operation) => {
    const receipt = await outbox.apply(operation);
    await outbox.drain();
    return receipt;
  };
  return { outbox, server, sourceId, sent };
}

type Server = Awaited<ReturnType<typeof phone>>['server'];

const capture = (sourceId: string, fields: { excerpt?: string; comment?: string }, id = uuidv7()): Operation => ({
  type: 'createNote',
  note: { id, sourceId, locator: 's. 45', ...fields },
});

describe('The outbox against the API', () => {
  // #36, scenario 6.
  it('keeps a Note whose Source was deleted elsewhere as "Kaynağı silinmiş", whether captured or moved there', async () => {
    const { outbox, server, sourceId, sent } = await phone();
    const { id: elsewhere } = await server.sources.create({ type: 'book', title: 'Tezâkir' });
    const moved = uuidv7();
    await sent(capture(sourceId, { excerpt: 'Kadı, naibini kendisi seçerdi.' }, moved));
    await server.sources.delete({ id: elsewhere });

    const captured = uuidv7();
    await sent(capture(elsewhere, { excerpt: 'Naip tayini.' }, captured));
    await sent({ type: 'moveNote', id: moved, sourceId: elsewhere });

    expect(outbox.state().status.get(captured)).toBe('sourceGone');
    expect(outbox.state().status.get(moved)).toBe('sourceGone');
    expect((await server.notes.list({ sourceId })).map((n) => n.id)).toEqual([moved]);
  });

  // What happens to the Excerpt's Note elsewhere, before the Comment reaches it.
  it.each<[string, (server: Server, id: string) => Promise<unknown>]>([
    ['took another Comment', (server, id) => server.notes.attachComment({ id, comment: 'Başka bir yorum.' })],
    ['was deleted', (server, id) => server.notes.delete({ id })],
  ])("makes a Comment its own Note when the Excerpt's Note %s", async (_, meanwhile) => {
    const { outbox, server, sourceId, sent } = await phone();
    const excerptNote = uuidv7();
    await sent(capture(sourceId, { excerpt: 'Kadı, naibini kendisi seçerdi.' }, excerptNote));
    await meanwhile(server, excerptNote);

    const ownNote = uuidv7();
    await sent({
      type: 'attachComment',
      id: excerptNote,
      comment: 'Naiplik bir tür kiralama mı?',
      ownNote: { id: ownNote, sourceId, locator: 's. 45' },
    });

    expect(await server.notes.get({ id: ownNote })).toMatchObject({
      locator: 's. 45',
      excerpt: null,
      comment: 'Naiplik bir tür kiralama mı?',
    });
    expect(outbox.state().status.get(ownNote)).toBe('synced');
    expect(outbox.state().waiting).toBe(0);
  });

  it('keeps an edit that would empty a Note as "gönderilemedi", and sends what comes after', async () => {
    const { outbox, server, sourceId, sent } = await phone();
    const id = uuidv7();
    await sent(capture(sourceId, { excerpt: 'Kadı, naibini kendisi seçerdi.' }, id));

    await outbox.apply({ type: 'updateNote', id, excerpt: '  ' });
    const after = uuidv7();
    await sent(capture(sourceId, { comment: 'Sonraki not.' }, after));

    expect(outbox.state().status.get(id)).toBe('refused');
    expect((await server.notes.get({ id })).excerpt).toBe('Kadı, naibini kendisi seçerdi.');
    expect(outbox.state().status.get(after)).toBe('synced');
    expect(outbox.state().waiting).toBe(1);
  });

  it('lets an edit and a move that reach a deleted Note go, without holding the queue up', async () => {
    const { outbox, server, sourceId, sent } = await phone();
    const { id: elsewhere } = await server.sources.create({ type: 'book', title: 'Tezâkir' });
    const id = uuidv7();
    await sent(capture(sourceId, { excerpt: 'Kadı, naibini kendisi seçerdi.' }, id));
    await server.notes.delete({ id });

    await outbox.apply({ type: 'updateNote', id, excerpt: 'Düzeltilmiş.' });
    await outbox.apply({ type: 'moveNote', id, sourceId: elsewhere });
    const after = uuidv7();
    await sent(capture(sourceId, { comment: 'Sonraki not.' }, after));

    expect(outbox.state().waiting).toBe(0);
    expect(await server.notes.list({ sourceId: elsewhere })).toEqual([]);
    expect((await server.notes.list({ sourceId })).map((n) => n.id)).toEqual([after]);
  });

  it('changes nothing the second time a Note is deleted, or its Comment detached', async () => {
    const { outbox, server, sourceId, sent } = await phone();
    const gone = uuidv7();
    await sent(capture(sourceId, { excerpt: 'Silinecek.' }, gone));
    const joined = uuidv7();
    await sent(capture(sourceId, { excerpt: 'Kadı, naibini kendisi seçerdi.', comment: 'Naiplik?' }, joined));

    await sent({ type: 'deleteNote', id: gone });
    const again = await sent({ type: 'deleteNote', id: gone });
    const commentNoteId = uuidv7();
    await sent({ type: 'detachComment', id: joined, commentNoteId });
    await sent({ type: 'detachComment', id: joined, commentNoteId });

    expect(outbox.state().waiting).toBe(0);
    // Nothing for the second deletion's Geri al to bring back.
    await again.undo?.();
    expect(await server.notes.list({ sourceId })).toMatchObject([
      { id: joined, excerpt: 'Kadı, naibini kendisi seçerdi.', comment: null },
      { id: commentNoteId, excerpt: null, comment: 'Naiplik?' },
    ]);
  });

  it('sends a Note again when the server saved it but the reply was lost, and it stays one Note', async () => {
    let sends = 0;
    // The server acts, but its first reply never reaches the phone.
    const replyLost = (real: Transport): Transport => ({
      ...real,
      async send(operation) {
        const reply = await real.send(operation);
        if (++sends === 1) throw new Error('Network request failed');
        return reply;
      },
    });
    const { outbox, server, sourceId, sent } = await phone({ transport: replyLost });
    const id = uuidv7();

    await sent(capture(sourceId, { excerpt: 'Kadı, naibini kendisi seçerdi.' }, id));

    expect(sends).toBe(2);
    expect(outbox.state().status.get(id)).toBe('synced');
    expect((await server.notes.list({ sourceId })).map((n) => n.id)).toEqual([id]);
  });

  it("takes a deletion and a move back through the server's Geri al", async () => {
    const { server, sourceId, sent } = await phone();
    const { id: elsewhere } = await server.sources.create({ type: 'book', title: 'Tezâkir' });
    const deleted = uuidv7();
    const moved = uuidv7();
    await sent(capture(sourceId, { excerpt: 'Silinecek.' }, deleted));
    await sent(capture(sourceId, { excerpt: 'Taşınacak.' }, moved));

    const deletion = await sent({ type: 'deleteNote', id: deleted });
    const move = await sent({ type: 'moveNote', id: moved, sourceId: elsewhere });
    expect((await server.notes.list({ sourceId: elsewhere })).map((n) => n.id)).toEqual([moved]);
    await deletion.undo?.();
    await move.undo?.();

    expect((await server.notes.list({ sourceId })).map((n) => n.id)).toEqual([deleted, moved]);
    expect(await server.notes.list({ sourceId: elsewhere })).toEqual([]);
  });
});
