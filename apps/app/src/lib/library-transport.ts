import type { Transport } from '@homelibra/outbox';
import { trpcTransport } from '@homelibra/outbox/trpc';

import { refreshLibrary } from './refresh-library';
import { queryClient, trpcClient } from './trpc';

const api = trpcTransport(trpcClient);

/**
 * The outbox's way to the API, on the phone and on the web: each operation
 * goes through the API procedure of its name (the outbox has no batch
 * endpoint of its own, spec #40). A reply comes once the Notes and Sources on
 * screen show it, so a Note never drops out of the list between leaving the
 * queue and arriving from the server.
 */
export const libraryTransport: Transport = {
  async send(operation) {
    const reply = await api.send(operation);
    if (reply.outcome === 'done') await refreshLibrary(operation.type === 'deleteNote' ? operation.id : undefined);
    return reply;
  },
  /** The server's Geri al; every query refreshes, as what comes back shows everywhere. */
  async undo(token) {
    await api.undo(token);
    await queryClient.invalidateQueries();
  },
};
