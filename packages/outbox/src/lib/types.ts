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
        /** Tag names from the picker, as notes.create takes them. */
        tags?: string[];
      };
    }
  | {
      type: 'attachComment';
      id: string;
      comment: string;
      tags?: string[];
      /**
       * Where the Comment goes if the Excerpt's Note no longer takes it (it
       * took another Comment, or went away elsewhere): a Note of its own at
       * the same Source and Locator, with the Tags chosen for it. Not sent;
       * the same id as Geri al's `commentNoteId`, so the two never make two Notes.
       */
      ownNote?: { id: string; sourceId: string; locator: string | null };
    }
  | { type: 'detachComment'; id: string; commentNoteId: string }
  | {
      type: 'updateNote';
      id: string;
      locator?: string | null;
      /** A corrected sort value; null derives it from the Locator again. */
      locatorSort?: number[] | null;
      excerpt?: string | null;
      comment?: string | null;
      /** All the Note's Tags, by name. */
      tags?: string[];
    }
  | { type: 'moveNote'; id: string; sourceId: string }
  | { type: 'deleteNote'; id: string };

/** A waiting operation as the device keeps it; `seq` is its place in the queue. */
export type StoredOperation = { seq: number; operation: Operation };

/** Where waiting operations live between launches: a table in expo-sqlite on the phone. */
export interface OutboxStorage {
  /** Every waiting operation, oldest first. */
  list(): Promise<StoredOperation[]>;
  /** Keeps an operation at the end of the queue; resolves with its `seq` once it is safely stored. */
  add(operation: Operation): Promise<number>;
  /** Changes a waiting operation where it stands in the queue. */
  replace(seq: number, operation: Operation): Promise<void>;
  remove(seq: number): Promise<void>;
}

/**
 * The server's answer to an operation: done (with the token of its Geri al,
 * for a delete or a move), "kaynak yok" (the Source it names is not in the
 * Library), or refused for good (a Comment the Note no longer takes, say).
 */
export type Reply = { outcome: 'done'; undoToken?: string | null } | { outcome: 'sourceGone' } | { outcome: 'refused' };

/**
 * How an operation reaches the server: the API procedure named by its type.
 * Resolves with the server's answer; rejects when the connection is down,
 * the reply is lost or the server failed, and the operation waits.
 */
export interface Transport {
  send(operation: Operation): Promise<Reply>;
  /** The server's Geri al, for an operation sent already. */
  undo(token: string): Promise<void>;
}

/**
 * kuyrukta / gönderiliyor / eşitlendi (server confirmed) / kaynağı silinmiş /
 * gönderilemedi (the server refused its text for good; it waits to be edited or deleted).
 */
export type NoteStatus = 'queued' | 'sending' | 'synced' | 'sourceGone' | 'refused';

/** What applying an operation hands back to the screen. */
export type Receipt = {
  /**
   * Geri al: takes the operation back out of the queue while it waits, or
   * through the server's Geri al once it was sent. Null when there is none.
   */
  undo: (() => Promise<void>) | null;
};
