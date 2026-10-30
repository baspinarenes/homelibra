import { compareNotes, locatorSortValue } from '@homelibra/core/note';

import type { Operation } from './types';

/** A Note as the Source page lists it, the API's `notes.list` row. */
export type ListedNote = {
  id: string;
  locator: string | null;
  locatorSort: number[] | null;
  excerpt: string | null;
  comment: string | null;
};

/** As the server keeps text: trimmed, and null when blank. */
const stored = (value: string | null | undefined) => value?.trim() || null;

/**
 * A Source's Notes with its waiting operations laid over them (spec: the
 * offline cache is read-only, the queue is shown on top of it). Each
 * operation does here what the server will do with it, and doing it again
 * changes nothing, so a Note already sent but not yet refetched shows once.
 */
export function withPendingNotes(
  sourceId: string,
  notes: readonly ListedNote[],
  pending: readonly Operation[],
): ListedNote[] {
  const byId = new Map(notes.map((note) => [note.id, note]));
  for (const operation of pending) {
    switch (operation.type) {
      case 'createNote': {
        const { id, locator, excerpt, comment } = operation.note;
        if (operation.note.sourceId !== sourceId || byId.has(id)) break;
        const kept = stored(locator);
        byId.set(id, {
          id,
          locator: kept,
          locatorSort: kept === null ? null : locatorSortValue(kept),
          excerpt: stored(excerpt),
          comment: stored(comment),
        });
        break;
      }
      case 'attachComment': {
        const note = byId.get(operation.id);
        if (note) byId.set(note.id, { ...note, comment: stored(operation.comment) });
        break;
      }
      case 'detachComment': {
        const note = byId.get(operation.id);
        if (!note?.comment || !note.excerpt || byId.has(operation.commentNoteId)) break;
        byId.set(note.id, { ...note, comment: null });
        byId.set(operation.commentNoteId, { ...note, id: operation.commentNoteId, excerpt: null });
        break;
      }
    }
  }
  return [...byId.values()].sort(compareNotes);
}
