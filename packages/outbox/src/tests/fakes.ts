import type { Operation, OutboxStorage, Reply, StoredOperation, Transport } from '../index';

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
    async replace(seq, operation) {
      const row = rows.find((r) => r.seq === seq);
      if (row) row.operation = operation;
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
 * server has acted. A Source exists until it is deleted "on the web".
 */
export function fakeServer() {
  const notes = new Map<string, ServerNote>();
  const deletedSources = new Set<string>();
  const undos = new Map<string, () => void>();
  const received: Operation[] = [];
  let connection: 'up' | 'down' | 'cutAfterReply' = 'up';
  let hold: { release: () => void; promise: Promise<void> } | null = null;

  const withUndo = (undo: () => void): Reply => {
    const token = `undo-${undos.size + 1}`;
    undos.set(token, undo);
    return { outcome: 'done', undoToken: token };
  };

  function act(operation: Operation): Reply {
    received.push(operation);
    switch (operation.type) {
      case 'createNote': {
        const { id, sourceId, locator = null, excerpt = null, comment = null } = operation.note;
        if (deletedSources.has(sourceId)) return { outcome: 'sourceGone' };
        // on conflict (id) do nothing
        if (!notes.has(id)) notes.set(id, { sourceId, locator, excerpt, comment });
        return { outcome: 'done' };
      }
      case 'attachComment': {
        const note = notes.get(operation.id);
        if (!note || (note.comment !== null && note.comment !== operation.comment)) return { outcome: 'refused' };
        note.comment = operation.comment;
        return { outcome: 'done' };
      }
      case 'detachComment': {
        if (notes.has(operation.commentNoteId)) return { outcome: 'done' };
        const note = notes.get(operation.id);
        if (!note?.excerpt || !note.comment) return { outcome: 'refused' };
        notes.set(operation.commentNoteId, { ...note, excerpt: null });
        note.comment = null;
        return { outcome: 'done' };
      }
      case 'updateNote': {
        const note = notes.get(operation.id);
        // An edit that reaches a deleted Note is ignored.
        if (!note) return { outcome: 'done' };
        const { locator, excerpt, comment } = operation;
        if (locator !== undefined) note.locator = locator;
        if (excerpt !== undefined) note.excerpt = excerpt;
        if (comment !== undefined) note.comment = comment;
        return { outcome: 'done' };
      }
      case 'moveNote': {
        if (deletedSources.has(operation.sourceId)) return { outcome: 'sourceGone' };
        const note = notes.get(operation.id);
        if (!note || note.sourceId === operation.sourceId) return { outcome: 'done', undoToken: null };
        const before = note.sourceId;
        note.sourceId = operation.sourceId;
        return withUndo(() => (note.sourceId = before));
      }
      case 'deleteNote': {
        const note = notes.get(operation.id);
        if (!note) return { outcome: 'done', undoToken: null };
        notes.delete(operation.id);
        return withUndo(() => notes.set(operation.id, note));
      }
    }
  }

  const reach = async () => {
    if (hold) await hold.promise;
    if (connection === 'down') throw new Error('Network request failed');
  };

  const transport: Transport = {
    async send(operation) {
      await reach();
      const reply = act(operation);
      if (connection === 'cutAfterReply') throw new Error('Network request failed');
      return reply;
    },
    async undo(token) {
      await reach();
      undos.get(token)?.();
      undos.delete(token);
    },
  };

  return {
    transport,
    notes,
    /** Every operation the server acted on, in arrival order. */
    received,
    /** The Source is deleted elsewhere, on the web say, with all its Notes. */
    deleteSource: (id: string) => {
      deletedSources.add(id);
      for (const [noteId, note] of notes) if (note.sourceId === id) notes.delete(noteId);
    },
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
