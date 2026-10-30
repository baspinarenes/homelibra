import type { NoteStatus, Operation, OutboxStorage, Receipt, Reply, StoredOperation, Transport } from './types';

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
   * The receipt's `undo` is the operation's Geri al, wherever it is by then.
   */
  apply(operation: Operation): Promise<Receipt>;
  /**
   * Sends the waiting operations in order, until none is left or one fails;
   * the ones after a failure wait for the next drain. A Note whose Source the
   * server no longer has waits as "Kaynağı silinmiş", and one whose text the
   * server refuses for good as "gönderilemedi" (until it is edited or
   * deleted); either holds only its own operations back. One drain runs at
   * a time: calling it while one runs joins that one.
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
    case 'detachComment':
      return [operation.id, operation.commentNoteId];
    default:
      return [operation.id];
  }
}

const touches = (operation: Operation, ids: ReadonlySet<string>) => notesOf(operation).some((id) => ids.has(id));

/** The operation sent to another Source instead, when its own is gone. */
function retarget(operation: Operation, sourceId: string): Operation {
  if (operation.type === 'createNote') return { ...operation, note: { ...operation.note, sourceId } };
  if (operation.type === 'moveNote') return { ...operation, sourceId };
  return operation;
}

type UpdateNote = Extract<Operation, { type: 'updateNote' }>;

type EditFields = Partial<Omit<UpdateNote, 'type' | 'id'>>;

/** What an edit sets, without the fields it leaves as they are. */
const setBy = ({ type: _, id: __, ...fields }: UpdateNote): EditFields =>
  Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

/** A new Note takes no sort value: the edit, sent after it, corrects that. */
const noteFields = ({ locatorSort: _, ...fields }: EditFields) => fields;

/** A refused operation with the scholar's edit in place of what it carried. */
function withEdit(operation: Operation, edit: UpdateNote): Operation {
  if (operation.type === 'updateNote') return { ...operation, ...setBy(edit) };
  if (operation.type === 'createNote') return { ...operation, note: { ...operation.note, ...noteFields(setBy(edit)) } };
  return operation;
}

/** An operation that carries a Note's text, which a refusal must not lose. */
const carriesText = (operation: Operation) => operation.type === 'createNote' || operation.type === 'updateNote';

/**
 * A Comment its Excerpt's Note no longer takes becomes a Note of its own,
 * as Geri al would make it: the text is never lost.
 */
function asOwnNote(operation: Operation): Operation | null {
  if (operation.type !== 'attachComment' || !operation.ownNote) return null;
  const { id, sourceId, locator } = operation.ownNote;
  return { type: 'createNote', note: { id, sourceId, locator, comment: operation.comment, tags: operation.tags } };
}

/** A Note held back by the operation `seq`, and why: its status. */
type Parked = { seq: number; why: 'sourceGone' | 'refused' };

type Settled = { promise: Promise<Reply | null>; settle: (reply: Reply | null) => void };
function settled(): Settled {
  let settle: (reply: Reply | null) => void = () => {};
  const promise = new Promise<Reply | null>((resolve) => (settle = resolve));
  return { promise, settle };
}

/** Opens the outbox on what the device kept from earlier launches. */
export async function openOutbox({ storage, transport }: OpenOutbox): Promise<Outbox> {
  const queue: StoredOperation[] = await storage.list();
  const synced = new Set<string>();
  // Notes held back, with the operation the server answered "kaynak yok" to,
  // or refused for good: a Note's text is never dropped.
  const parked = new Map<string, Parked>();
  // How each operation applied since opening ended: the server's reply, or
  // null when it left the queue unsent.
  const outcomes = new Map<number, Settled>();
  let sending: number | null = null;
  let running: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const snapshot = (): OutboxState => {
    const status = new Map<string, NoteStatus>();
    for (const id of synced) status.set(id, 'synced');
    for (const { seq, operation } of queue) {
      for (const id of notesOf(operation)) {
        const held = parked.get(id);
        if (held) status.set(id, held.why);
        else if (status.get(id) !== 'sending') status.set(id, seq === sending ? 'sending' : 'queued');
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

  const finish = (seq: number, reply: Reply | null) => {
    outcomes.get(seq)?.settle(reply);
    outcomes.delete(seq);
  };

  /** Takes waiting operations out of the queue: from memory at once, so a running drain cannot pick them up. */
  const take = async (rows: readonly StoredOperation[]) => {
    const seqs = new Set(rows.map((row) => row.seq));
    for (let i = queue.length - 1; i >= 0; i--) if (seqs.has(queue[i]!.seq)) queue.splice(i, 1);
    for (const [id, { seq }] of parked) if (seqs.has(seq)) parked.delete(id);
    changed();
    for (const { seq } of rows) {
      await storage.remove(seq);
      finish(seq, null);
    }
  };

  const enqueue = async (operation: Operation) => {
    const seq = await storage.add(operation);
    queue.push({ seq, operation });
    outcomes.set(seq, settled());
    for (const id of notesOf(operation)) synced.delete(id);
    changed();
    void drain();
    return seq;
  };

  /** The next operation to send: the oldest one not about a Note held back (Kaynağı silinmiş, gönderilemedi). */
  const next = () => {
    const held = new Set(parked.keys());
    for (const row of queue) {
      if (!touches(row.operation, held)) return row;
      // What a held Note's operation also touches waits with it.
      for (const id of notesOf(row.operation)) held.add(id);
    }
    return undefined;
  };

  const run = async () => {
    for (let head = next(); head; head = next()) {
      const { seq, operation } = head;
      sending = seq;
      changed();
      let reply: Reply;
      try {
        reply = await transport.send(operation);
      } catch {
        sending = null;
        changed();
        return;
      }
      // Still "sending" until the queue shows the reply, so nothing applied
      // meanwhile takes the operation out from under it.
      if (reply.outcome === 'sourceGone' && (operation.type === 'createNote' || operation.type === 'moveNote')) {
        parked.set(notesOf(operation)[0]!, { seq, why: 'sourceGone' });
      } else if (reply.outcome === 'refused' && asOwnNote(operation)) {
        // Sent next, in the refused operation's place.
        head.operation = asOwnNote(operation)!;
        await storage.replace(seq, head.operation);
      } else if (reply.outcome === 'refused' && carriesText(operation)) {
        // "Gönderilemedi": it waits, with its text, to be edited or deleted.
        parked.set(notesOf(operation)[0]!, { seq, why: 'refused' });
      } else {
        // Done, or refused for good with no text to keep (a move, a deletion):
        // it leaves the queue.
        queue.splice(queue.indexOf(head), 1);
        if (reply.outcome === 'done') for (const id of notesOf(operation)) synced.add(id);
        await storage.remove(seq);
        finish(seq, reply);
      }
      sending = null;
      changed();
    }
  };

  // Asked for while one ran: the network may be back since that one failed.
  let again = false;
  const drain = () => {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      try {
        do {
          again = false;
          await run();
        } while (again);
      } finally {
        // At once, with no turn in between where a call would join a drain already over.
        running = null;
      }
    })();
    return running;
  };

  /**
   * Geri al for an operation in the queue: out of it while it waits;
   * through the server's own Geri al once it has been sent.
   */
  const undoQueued = (seq: number) => {
    const outcome = outcomes.get(seq);
    return async (): Promise<void> => {
      const row = queue.find((r) => r.seq === seq);
      if (row && seq !== sending) return take([row]);
      const reply = await outcome?.promise;
      if (reply?.outcome === 'done' && reply.undoToken) await transport.undo(reply.undoToken);
    };
  };

  /** The waiting operations about this Note, but not one being sent. */
  const waitingFor = (id: string) => queue.filter((row) => row.seq !== sending && notesOf(row.operation).includes(id));

  const deleteNote = async (operation: Extract<Operation, { type: 'deleteNote' }>): Promise<Receipt> => {
    const rows = waitingFor(operation.id);
    const alone = rows.every((row) => notesOf(row.operation).length === 1);
    const unsent = rows.some((row) => row.operation.type === 'createNote');
    // Never sent: it leaves the queue with all it waited to do, and never
    // reaches the server. Geri al puts it all back.
    if (unsent && alone) {
      await take(rows);
      return {
        undo: async () => {
          for (const row of rows) await enqueue(row.operation);
        },
      };
    }
    // A move or an edit the server refused needs no sending before the Note goes.
    const refused = parked.get(operation.id)?.seq;
    if (refused !== undefined && alone) await take(rows.filter((row) => row.seq === refused));
    return { undo: undoQueued(await enqueue(operation)) };
  };

  const moveNote = async (operation: Extract<Operation, { type: 'moveNote' }>): Promise<Receipt> => {
    const held = parked.get(operation.id);
    const row = held?.why === 'sourceGone' ? queue.find((r) => r.seq === held.seq) : undefined;
    // Otherwise it waits its turn; behind a refused text, until that is edited.
    if (!row) return { undo: undoQueued(await enqueue(operation)) };
    // Kaynağı silinmiş: the new Source takes the refused operation's place,
    // and the Note goes out to it.
    row.operation = retarget(row.operation, operation.sourceId);
    parked.delete(operation.id);
    await storage.replace(row.seq, row.operation);
    changed();
    void drain();
    return { undo: null };
  };

  const updateNote = async (operation: UpdateNote): Promise<Receipt> => {
    const held = parked.get(operation.id);
    const row = held?.why === 'refused' ? queue.find((r) => r.seq === held.seq) : undefined;
    if (row) {
      // Gönderilemedi: the edit takes the refused text's place, and it goes
      // out again. The edit itself still follows, after what else waited for
      // the Note, so the scholar's last word is the one kept.
      row.operation = withEdit(row.operation, operation);
      parked.delete(operation.id);
      await storage.replace(row.seq, row.operation);
    }
    await enqueue(operation);
    return { undo: null };
  };

  return {
    async apply(operation) {
      if (operation.type === 'deleteNote') return deleteNote(operation);
      if (operation.type === 'moveNote') return moveNote(operation);
      if (operation.type === 'updateNote') return updateNote(operation);
      await enqueue(operation);
      return { undo: null };
    },
    drain,
    state: () => current,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
