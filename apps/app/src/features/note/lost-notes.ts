import { type KnownNote, type OutboxState, pendingNote } from '@homelibra/outbox';

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
