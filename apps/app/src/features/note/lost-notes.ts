import { type KnownNote, type OutboxState, pendingNote } from '@homelibra/outbox';
import type { Command } from '@homelibra/ui/wide-layout';

/**
 * Kaynağı silinmiş (#36, #58): the phone's Notes whose Source was deleted
 * elsewhere while they waited to be sent, as the phone has them now (what
 * waits in the outbox played over the Notes it knows, `known`). A Note
 * leaves the list once it is moved to another Source or deleted.
 */
export function lostNotes(state: OutboxState, known: readonly KnownNote[]): KnownNote[] {
  return [...state.status]
    .filter(([, status]) => status === 'sourceGone')
    .flatMap(([id]) => pendingNote(id, state.pending, known) ?? []);
}

/**
 * The lost Note a wide screen's panel shows (ADR-0012): the one it was
 * opened on (`focusId`), while it is still among the `lost`; none once it
 * has gone, moved to a new Source or deleted, and the panel closes.
 */
export function shownLostNote(focusId: string | null, lost: readonly KnownNote[]): KnownNote | null {
  return lost.find((note) => note.id === focusId) ?? null;
}

/**
 * What a key does to the wide list of lost Notes (#186), as a Collection's
 * keys do: ↑↓ choose a row, the one before or after `chosen` (from none,
 * the first going down, the last going up; it stays on the first and the
 * last), and ↵ opens the chosen one in the panel. While the panel is open
 * the keys are its edit's: Esc puts it away (asking first with changes).
 */
export function lostNoteAction(
  command: Command,
  { notes, chosen, panelOpen }: { notes: readonly { id: string }[]; chosen: string | null; panelOpen: boolean },
): { choose: string } | { open: string } | null {
  if (panelOpen || notes.length === 0) return null;
  const at = notes.findIndex((note) => note.id === chosen);
  if (command === 'open') return at >= 0 ? { open: notes[at]!.id } : null;
  if (command !== 'previous' && command !== 'next') return null;
  const down = command === 'next';
  const to = at < 0 ? (down ? 0 : notes.length - 1) : Math.min(Math.max(at + (down ? 1 : -1), 0), notes.length - 1);
  return { choose: notes[to]!.id };
}
