import type { NotePlace, SiblingNote } from '@homelibra/ui/note-panel';

/**
 * Which Note a wide screen's panel shows (ADR-0012): screen state, never a
 * setting. It names the Source too, because ‹ › walk all the Source's Notes
 * and can land on one the list does not hold.
 */
export type NoteFocus = { sourceId: string; noteId: string };

/** What stepping needs of a list of Notes grouped by Source: a Collection's view, a Tag's page. */
type StepView = { groups: readonly { source: { id: string }; notes: readonly { id: string }[] }[] };

/** A Note of a Source as notes.list gives them, in Locator order. */
type SourceNote = { id: string; locator: string | null; excerpt: string | null; comment: string | null };

/**
 * The Note ↑ (`previous`) or ↓ (`next`) moves the panel to: the row before
 * or after, across the Sources; it stays on the first and the last. With no
 * Note open it starts at the first row going down, the last going up. From
 * a Note with no row it goes to the nearest row by the Note's place in its
 * Source (`sourceOrder`, its Source's Note ids in Locator order), or into
 * its Source's rows while that is not known. Null only in an empty view.
 */
export function stepInView(
  view: StepView,
  focus: NoteFocus | null,
  direction: 'previous' | 'next',
  sourceOrder?: readonly string[],
): NoteFocus | null {
  const rows = view.groups.flatMap((group) =>
    group.notes.map((note) => ({ sourceId: group.source.id, noteId: note.id })),
  );
  if (rows.length === 0) return null;
  const down = direction === 'next';
  const end = down ? rows[0]! : rows[rows.length - 1]!;
  if (!focus) return end;

  const index = rows.findIndex((row) => row.noteId === focus.noteId);
  if (index >= 0) return rows[Math.min(Math.max(index + (down ? 1 : -1), 0), rows.length - 1)]!;

  const first = rows.findIndex((row) => row.sourceId === focus.sourceId);
  if (first < 0) return end;
  let last = first;
  while (rows[last + 1]?.sourceId === focus.sourceId) last += 1;
  const at = sourceOrder?.indexOf(focus.noteId) ?? -1;
  if (at < 0) return rows[down ? first : last]!;

  // The Source's rows that come after (or before) the Note in the Source's own order.
  const group = rows.slice(first, last + 1);
  const after = sourceOrder!.slice(at + 1);
  const before = sourceOrder!.slice(0, at).reverse();
  const near = (down ? after : before).find((id) => group.some((row) => row.noteId === id));
  if (near) return group.find((row) => row.noteId === near)!;
  return rows[down ? last + 1 : first - 1] ?? focus;
}

/** Where the Note stands among its Source's Notes: n / m and the Notes either side; null for one not among them. */
export function placeInSource(notes: readonly SourceNote[], noteId: string): NotePlace | null {
  const index = notes.findIndex((note) => note.id === noteId);
  if (index < 0) return null;
  const near = (note: SourceNote | undefined) => (note ? { id: note.id, locator: note.locator } : null);
  return { n: index + 1, total: notes.length, previous: near(notes[index - 1]), next: near(notes[index + 1]) };
}

/** Bu kaynaktan diğer notlar: the Source's other Notes by Excerpt, or Comment, and whether the list holds each. */
export function siblingsOf(
  notes: readonly SourceNote[],
  noteId: string,
  inView: (id: string) => boolean,
): SiblingNote[] {
  return notes
    .filter((note) => note.id !== noteId)
    .map((note) => ({
      id: note.id,
      locator: note.locator,
      text: note.excerpt ?? note.comment ?? '',
      inView: inView(note.id),
    }));
}
