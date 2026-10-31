import { describe, expect, it } from 'vitest';

import { type Operation, openOutbox } from '../index';
import { memoryStorage } from '../memory';
import { trpcTransport } from '../trpc';

const N1 = '01900000-0001-7000-8000-000000000001';
const SOURCE = '01900000-0000-7000-8000-00000000000a';

const capture: Operation = { type: 'createNote', note: { id: N1, sourceId: SOURCE, excerpt: 'bir' } };

/** A tRPC client whose every call fails with `error`, as one does with the connection down. */
function failingClient(error: unknown): Parameters<typeof trpcTransport>[0] {
  const mutation = { mutate: () => Promise.reject(error) };
  return {
    notes: {
      create: mutation,
      attachComment: mutation,
      detachComment: mutation,
      update: mutation,
      move: mutation,
      delete: mutation,
    },
    undo: mutation,
  };
}

// The server's own refusals are the contract test's (apps/api/src/outbox-contract.test.ts).
describe('trpcTransport', () => {
  it.each([
    ['a lost connection', new TypeError('Network request failed')],
    ['a tRPC client error without a server answer', Object.assign(new Error('Failed to fetch'), { data: undefined })],
    ['a server error', Object.assign(new Error('boom'), { data: { code: 'INTERNAL_SERVER_ERROR' } })],
    ['an expired session', Object.assign(new Error('UNAUTHORIZED'), { data: { code: 'UNAUTHORIZED' } })],
    ['something not an Error', 'down'],
  ])('throws %s again, and the operation waits', async (_, error) => {
    const transport = trpcTransport(failingClient(error));
    await expect(transport.send(capture)).rejects.toBe(error);

    const outbox = await openOutbox({ storage: memoryStorage(), transport });
    await outbox.apply(capture);
    await outbox.drain();

    expect(outbox.state().status.get(N1)).toBe('queued');
    expect(outbox.state().pending).toEqual([capture]);
  });
});
