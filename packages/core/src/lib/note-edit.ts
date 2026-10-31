import { locatorSortValue } from './locator-order';

/** A Note as it is stored: its Locator, the sort value it is ordered by, and its texts. */
export type NoteFields = {
  locator: string | null;
  locatorSort: number[] | null;
  excerpt: string | null;
  comment: string | null;
};

/** A Note's texts as typed, before they are stored. */
export type NoteText = { locator?: string | null; excerpt?: string | null; comment?: string | null };

/** A change to a stored Note. A field left out stays; a blank or null one is emptied. */
export type NoteEdit = NoteText;

// Blank means empty. Inner line breaks stay: an Excerpt is copied verbatim.
const stored = (text: string | null | undefined) => text?.trim() || null;

/** The sort value a Locator gets: the only one a Note has (#125). */
const derivedSort = (locator: string | null) => (locator === null ? null : locatorSortValue(locator));

// A Note is kept only with an Excerpt or a Comment.
const withText = (note: NoteFields) => (note.excerpt || note.comment ? note : null);

/**
 * A Note as captured is stored: its texts trimmed, its sort value read from
 * its Locator. Null when it has neither an Excerpt nor a Comment. The server
 * stores it this way and the outbox shows it this way while it waits.
 */
export function capturedNote({ locator, excerpt, comment }: NoteText): NoteFields | null {
  const kept = stored(locator);
  return withText({
    locator: kept,
    locatorSort: derivedSort(kept),
    excerpt: stored(excerpt),
    comment: stored(comment),
  });
}

/**
 * A stored Note with an edit over it: its sort value read from the
 * resulting Locator, whatever was stored before, so an edit that leaves the
 * Locator as it was derives it again too. A Note without a Locator has none.
 * Null when the edit would leave neither an Excerpt nor a Comment; the Note
 * then stays as it was.
 */
export function editedNote(current: Omit<NoteFields, 'locatorSort'>, edit: NoteEdit): NoteFields | null {
  const locator = edit.locator === undefined ? current.locator : stored(edit.locator);
  return withText({
    locator,
    locatorSort: derivedSort(locator),
    excerpt: edit.excerpt === undefined ? current.excerpt : stored(edit.excerpt),
    comment: edit.comment === undefined ? current.comment : stored(edit.comment),
  });
}
