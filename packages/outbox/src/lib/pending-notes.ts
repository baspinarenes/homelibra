import { compareTr } from '@homelibra/core';
import { compareNotes, locatorSortValue } from '@homelibra/core/note';
import { tagIdentity, tagName } from '@homelibra/core/tag';

import type { Operation } from './types';

/** A Note as the Source page lists it, the API's `notes.list` row. */
export type ListedNote = {
  id: string;
  locator: string | null;
  locatorSort: number[] | null;
  excerpt: string | null;
  comment: string | null;
  /** The Note's own Tags, A–Z. A waiting Note's are only names yet. */
  tags: readonly { name: string }[];
};

/** As the server keeps text: trimmed, and null when blank. */
const stored = (value: string | null | undefined) => value?.trim() || null;

/**
 * The Tags with these names added, as the server will keep them: without a
 * leading #, once per identity, A–Z. A name the Library already spells
 * otherwise shows as typed until the list comes back from the server.
 */
function withTags(tags: readonly { name: string }[], names: readonly string[] = []) {
  const byIdentity = new Map(tags.map((tag) => [tagIdentity(tag.name), tag]));
  for (const name of names.map(tagName)) {
    if (name && !byIdentity.has(tagIdentity(name))) byIdentity.set(tagIdentity(name), { name });
  }
  return [...byIdentity.values()].sort((a, b) => compareTr(a.name, b.name));
}

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
          tags: withTags([], operation.note.tags),
        });
        break;
      }
      case 'attachComment': {
        const note = byId.get(operation.id);
        if (note)
          byId.set(note.id, {
            ...note,
            comment: stored(operation.comment),
            tags: withTags(note.tags, operation.tags),
          });
        break;
      }
      case 'detachComment': {
        const note = byId.get(operation.id);
        if (!note?.comment || !note.excerpt || byId.has(operation.commentNoteId)) break;
        byId.set(note.id, { ...note, comment: null });
        // The server gives the Comment's own Note no Tags.
        byId.set(operation.commentNoteId, { ...note, id: operation.commentNoteId, excerpt: null, tags: [] });
        break;
      }
    }
  }
  return [...byId.values()].sort(compareNotes);
}
