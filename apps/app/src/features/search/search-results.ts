import { type NoteFocus, stepInView } from '@/features/collection/note-focus';

/** A run of a result's text; `hit` runs are the words it matched. */
type Segment = { text: string; hit: boolean };

/** What a wide Ara's row needs of a Note found by `search.library`. */
type FoundNote = {
  id: string;
  sourceId: string;
  title: string;
  author: string | null;
  fromComment: boolean;
  snippet: readonly Segment[];
};

/**
 * A found Note as the wide list's row (@homelibra/ui's NoteRow) takes it:
 * the part the search shows, as the Excerpt, or as the Comment when only
 * the Comment matched, its words marked.
 */
export function resultRow(note: FoundNote) {
  const text = note.snippet.map((segment) => segment.text).join('');
  return note.fromComment
    ? { excerpt: null, comment: text, marks: { comment: note.snippet } }
    : { excerpt: text, comment: null, marks: { excerpt: note.snippet } };
}

/** Under a wide row: Yazar, Başlık, and `fromComment` ("yorumdan") when the part is from the Comment. */
export function resultMeta(note: FoundNote, fromComment: string) {
  return [[note.author, note.title].filter(Boolean).join(', '), note.fromComment && fromComment]
    .filter(Boolean)
    .join(' · ');
}

/**
 * The Note ↑ (`previous`) or ↓ (`next`) moves the panel to: the result
 * before or after in the order the search ranked them, across Sources, as
 * a Collection's view steps (`stepInView`). From a Note the panel walked
 * to outside the results (‹ ›, a sibling), the nearest of its Source's
 * results by `sourceOrder` (its Source's Note ids in Locator order), wherever
 * the ranking put them; with none that way, the result after (or before)
 * the Source's results.
 */
export function stepInResults(
  notes: readonly Pick<FoundNote, 'id' | 'sourceId'>[],
  focus: NoteFocus | null,
  direction: 'previous' | 'next',
  sourceOrder?: readonly string[],
): NoteFocus | null {
  const rows = notes.map((note) => ({ sourceId: note.sourceId, noteId: note.id }));
  if (!focus || rows.some((row) => row.noteId === focus.noteId)) {
    // Each result its own group keeps the ranked order.
    const groups = rows.map((row) => ({ source: { id: row.sourceId }, notes: [{ id: row.noteId }] }));
    return stepInView({ groups }, focus, direction);
  }
  if (rows.length === 0) return null;
  const down = direction === 'next';
  const own = rows.filter((row) => row.sourceId === focus.sourceId);
  if (own.length === 0) return down ? rows[0]! : rows[rows.length - 1]!;
  const at = sourceOrder?.indexOf(focus.noteId) ?? -1;
  if (at < 0) return down ? own[0]! : own[own.length - 1]!;
  const way = down ? sourceOrder!.slice(at + 1) : sourceOrder!.slice(0, at).reverse();
  const near = way.find((id) => own.some((row) => row.noteId === id));
  if (near) return own.find((row) => row.noteId === near)!;
  const index = rows.indexOf(own[down ? own.length - 1 : 0]!);
  return rows[index + (down ? 1 : -1)] ?? focus;
}
