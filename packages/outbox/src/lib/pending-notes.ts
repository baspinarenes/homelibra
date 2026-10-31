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

/** A Note the phone knows of, with the Source it is in. */
export type KnownNote = ListedNote & { sourceId: string };

/** As the server keeps text: trimmed, and null when blank. */
const stored = (value: string | null | undefined) => value?.trim() || null;

/** The sort value a Locator gets until the scholar corrects it. */
const derivedSort = (locator: string | null) => (locator === null ? null : locatorSortValue(locator));

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
 * The Notes the phone knows with its waiting operations played over them.
 * Each operation does here what the server will do with it, and doing it
 * again changes nothing, so a Note already sent but not yet refetched shows
 * once.
 */
function replay(known: Iterable<KnownNote>, pending: readonly Operation[]) {
  const byId = new Map<string, KnownNote>();
  for (const note of known) byId.set(note.id, note);
  for (const operation of pending) {
    switch (operation.type) {
      case 'createNote': {
        const { id, sourceId, locator, excerpt, comment } = operation.note;
        if (byId.has(id)) break;
        const kept = stored(locator);
        byId.set(id, {
          id,
          sourceId,
          locator: kept,
          locatorSort: derivedSort(kept),
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
      case 'updateNote': {
        const note = byId.get(operation.id);
        if (!note) break;
        const locator = operation.locator === undefined ? note.locator : stored(operation.locator);
        const locatorSort =
          operation.locatorSort !== undefined
            ? (operation.locatorSort ?? derivedSort(locator))
            : locator !== note.locator
              ? derivedSort(locator)
              : note.locatorSort;
        byId.set(note.id, {
          ...note,
          locator,
          locatorSort,
          excerpt: operation.excerpt === undefined ? note.excerpt : stored(operation.excerpt),
          comment: operation.comment === undefined ? note.comment : stored(operation.comment),
          tags: operation.tags ? withTags([], operation.tags) : note.tags,
        });
        break;
      }
      case 'moveNote': {
        const note = byId.get(operation.id);
        if (note) byId.set(note.id, { ...note, sourceId: operation.sourceId });
        break;
      }
      case 'deleteNote':
        byId.delete(operation.id);
        break;
    }
  }
  return byId;
}

const listed = ({ sourceId: _, ...note }: KnownNote): ListedNote => note;

/**
 * A Source's Notes with the waiting operations laid over them (spec: the
 * offline cache is read-only, the queue is shown on top of it), in Locator
 * order. `elsewhere` are the Notes the phone knows from other Sources' lists,
 * so a Note waiting to move here shows here.
 */
export function withPendingNotes(
  sourceId: string,
  notes: readonly ListedNote[],
  pending: readonly Operation[],
  elsewhere: readonly KnownNote[] = [],
): ListedNote[] {
  const known = [...elsewhere.filter((note) => note.sourceId !== sourceId), ...notes.map((n) => ({ ...n, sourceId }))];
  return [...replay(known, pending).values()]
    .filter((note) => note.sourceId === sourceId)
    .map(listed)
    .sort(compareNotes);
}

/**
 * One Note as the phone has it now, with its waiting operations played over
 * it: one never sent, or one the phone knows from a list. Null when it is
 * deleted, or the phone never saw it.
 */
export function pendingNote(id: string, pending: readonly Operation[], known: readonly KnownNote[]): KnownNote | null {
  return replay(known, pending).get(id) ?? null;
}
