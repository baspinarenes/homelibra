import type { NoteStatus, Operation, OutboxStorage, StoredOperation, Transport } from './types';

export type OutboxState = {
  /** The operations still waiting, oldest first. */
  pending: readonly Operation[];
  /** Each Note the outbox has handled since it opened, by id. */
  status: ReadonlyMap<string, NoteStatus>;
  /** How many Notes have operations waiting: "N not bekliyor". */
  waiting: number;
};

export type Outbox = {
  /**
   * The screens' one way in: "işlemi uygula". Resolves once the operation is
   * stored, then sending starts; a screen never waits on the connection.
   */
  apply(operation: Operation): Promise<void>;
  /**
   * Sends the waiting operations in order, until none is left or one fails;
   * the ones after a failure wait for the next drain. One drain runs at a
   * time: calling it while one runs joins that one.
   */
  drain(): Promise<void>;
  /** A new object on every change, so React can read it as an external store. */
  state(): OutboxState;
  subscribe(listener: () => void): () => void;
};

export type OpenOutbox = { storage: OutboxStorage; transport: Transport };

/** The Notes an operation is about; the first is the one it saves. */
function notesOf(operation: Operation): string[] {
  switch (operation.type) {
    case 'createNote':
      return [operation.note.id];
    case 'attachComment':
      return [operation.id];
    case 'detachComment':
      return [operation.id, operation.commentNoteId];
  }
}

/** Opens the outbox on what the device kept from earlier launches. */
export async function openOutbox({ storage, transport }: OpenOutbox): Promise<Outbox> {
  const queue: StoredOperation[] = await storage.list();
  const synced = new Set<string>();
  let sending: number | null = null;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const snapshot = (): OutboxState => {
    const status = new Map<string, NoteStatus>();
    for (const id of synced) status.set(id, 'synced');
    for (const { seq, operation } of queue) {
      for (const id of notesOf(operation)) {
        if (status.get(id) !== 'sending') status.set(id, seq === sending ? 'sending' : 'queued');
      }
    }
    const waiting = [...status.values()].filter((s) => s !== 'synced').length;
    return { pending: queue.map((row) => row.operation), status, waiting };
  };
  let current = snapshot();
  const changed = () => {
    current = snapshot();
    for (const listener of listeners) listener();
  };

  const run = async () => {
    for (let head = queue[0]; head; head = queue[0]) {
      sending = head.seq;
      changed();
      try {
        await transport.send(head.operation);
      } catch {
        sending = null;
        changed();
        return;
      }
      await storage.remove(head.seq);
      queue.shift();
      for (const id of notesOf(head.operation)) synced.add(id);
      sending = null;
      changed();
    }
  };

  const drain = () => {
    running ??= run().finally(() => {
      running = null;
    });
    return running;
  };

  return {
    async apply(operation) {
      const seq = await storage.add(operation);
      queue.push({ seq, operation });
      for (const id of notesOf(operation)) synced.delete(id);
      changed();
      void drain();
    },
    drain,
    state: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
