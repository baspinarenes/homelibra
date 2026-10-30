/**
 * What the outbox carries: the screens' Note operations, each the input of
 * the API procedure of the same name. Every one of them is idempotent on the
 * server, so sending one twice changes nothing (ADR-0008).
 */
export type Operation =
  | {
      type: 'createNote';
      note: {
        id: string;
        sourceId: string;
        locator?: string | null;
        excerpt?: string | null;
        comment?: string | null;
      };
    }
  | { type: 'attachComment'; id: string; comment: string }
  | { type: 'detachComment'; id: string; commentNoteId: string };

/** A waiting operation as the device keeps it; `seq` is its place in the queue. */
export type StoredOperation = { seq: number; operation: Operation };

/** Where waiting operations live between launches: a table in expo-sqlite on the phone. */
export interface OutboxStorage {
  /** Every waiting operation, oldest first. */
  list(): Promise<StoredOperation[]>;
  /** Keeps an operation at the end of the queue; resolves with its `seq` once it is safely stored. */
  add(operation: Operation): Promise<number>;
  remove(seq: number): Promise<void>;
}

/**
 * How an operation reaches the server: the API procedure named by its type.
 * Resolves once the server has confirmed it; rejects when the connection is
 * down, the reply is lost or the server failed, and the operation waits.
 */
export interface Transport {
  send(operation: Operation): Promise<void>;
}

/** kuyrukta / gönderiliyor / eşitlendi (server confirmed). */
export type NoteStatus = 'queued' | 'sending' | 'synced';
