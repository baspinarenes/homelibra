import type { Operation, OutboxStorage, StoredOperation, Transport } from '../index';

/** The device's outbox table, in memory: survives an Outbox being opened again on it. */
export function memoryStorage(): OutboxStorage & { rows: StoredOperation[] } {
  const rows: StoredOperation[] = [];
  let next = 1;
  return {
    rows,
    async list() {
      return rows.map((row) => ({ ...row }));
    },
    async add(operation) {
      const row = { seq: next++, operation };
      rows.push(row);
      return row.seq;
    },
    async remove(seq) {
      const index = rows.findIndex((row) => row.seq === seq);
      if (index >= 0) rows.splice(index, 1);
    },
  };
}

type ServerNote = { sourceId: string; locator: string | null; excerpt: string | null; comment: string | null };

/**
 * The API as the outbox meets it: the same idempotent procedures the screens
 * call, reached over a connection that can be down, slow or cut after the
 * server has acted.
 */
export function fakeServer() {
  const notes = new Map<string, ServerNote>();
  const received: Operation[] = [];
  let connection: 'up' | 'down' | 'cutAfterReply' = 'up';
  let hold: { release: () => void; promise: Promise<void> } | null = null;

  function act(operation: Operation) {
    received.push(operation);
    switch (operation.type) {
      case 'createNote': {
        const { id, sourceId, locator = null, excerpt = null, comment = null } = operation.note;
        // on conflict (id) do nothing
        if (!notes.has(id)) notes.set(id, { sourceId, locator, excerpt, comment });
        return;
      }
      case 'attachComment': {
        const note = notes.get(operation.id);
        if (note) note.comment = operation.comment;
        return;
      }
      case 'detachComment': {
        const note = notes.get(operation.id);
        if (!note || notes.has(operation.commentNoteId)) return;
        notes.set(operation.commentNoteId, { ...note, excerpt: null });
        note.comment = null;
        return;
      }
    }
  }

  const transport: Transport = {
    async send(operation) {
      if (hold) await hold.promise;
      if (connection === 'down') throw new Error('Network request failed');
      act(operation);
      if (connection === 'cutAfterReply') throw new Error('Network request failed');
    },
  };

  return {
    transport,
    notes,
    /** Every operation the server acted on, in arrival order. */
    received,
    goOffline: () => (connection = 'down'),
    goOnline: () => (connection = 'up'),
    /** The server acts, but the reply never reaches the phone. */
    cutRepliesOff: () => (connection = 'cutAfterReply'),
    /** Sends wait until `release()`. */
    slowDown: () => {
      let release = () => {};
      const promise = new Promise<void>((resolve) => (release = resolve));
      hold = {
        promise,
        release: () => {
          hold = null;
          release();
        },
      };
      return hold.release;
    },
  };
}
