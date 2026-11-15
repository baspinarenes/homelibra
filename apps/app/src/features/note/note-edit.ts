import { type KnownNote, pendingNote } from '@homelibra/outbox';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { knownNotes } from '@/features/note/known-notes';
import type { PickedSource } from '@/features/source/source-picker';
import { useOutbox } from '@/lib/outbox';
import { useTRPC } from '@/lib/trpc';
import { offerReceiptUndo } from '@/lib/undo';

/**
 * The Note `id` as it is to be edited: the server's or the phone's, with
 * what waits in the outbox laid over it (#58). `sourceGone`: its Source was
 * deleted elsewhere while it waited; `refused`: the server refused its text
 * ("gönderilemedi"), and saving sends it again. Once deleted from here, the
 * last Note seen stays, so the form stays up while its screen goes.
 * `unavailable` says why there is no Note yet.
 */
export function useEditedNote(id: string): {
  note: KnownNote | null;
  sourceGone: boolean;
  refused: boolean;
  unavailable: 'loading' | 'failed' | 'offline' | null;
} {
  const trpc = useTRPC();
  const { state } = useOutbox();
  // A Note never sent is not on the server yet: the phone has it.
  const unsent = state.pending.some((operation) => operation.type === 'createNote' && operation.note.id === id);
  const fetched = useQuery({ ...trpc.notes.get.queryOptions({ id }), enabled: !unsent });
  const deletedElsewhere = fetched.error?.data?.code === 'NOT_FOUND';
  // None when the server says it is not there (deleted elsewhere).
  const note = useMemo(
    () => (deletedElsewhere ? null : pendingNote(id, state.pending, knownNotes())),
    // fetched.data is in the cache knownNotes reads: when it comes, look again.
    [id, state.pending, fetched.data, deletedElsewhere],
  );
  const kept = useRef(note);
  if (note) kept.current = note;
  // Only this Note's last sight: a new `id` never shows the one before.
  const shown = kept.current?.id === id ? kept.current : null;
  return {
    note: shown,
    sourceGone: state.status.get(id) === 'sourceGone',
    refused: state.status.get(id) === 'refused',
    unavailable: shown ? null : fetched.isError ? 'failed' : fetched.fetchStatus === 'paused' ? 'offline' : 'loading',
  };
}

/** Done with the edit: saved, `sourceId` where the Note is now; or deleted. */
export type EditEnd = { saved: { sourceId: string } } | { deleted: true };

/**
 * Notu düzenle's draft of `note` and what saving and deleting do, wherever
 * the Note is edited (its own page on the phone, in place on a wide
 * screen). Saving updates the Note, then moves it to the Source chosen in
 * the Kaynak field; Notu sil deletes it at once. Both go through the outbox
 * (`apply`), so a Note waiting to be sent is edited just the same (#58),
 * and both offer Geri al once `onEnd` has taken the edit away (#36).
 */
export function useNoteDraft(note: KnownNote, sourceGone: boolean, onEnd: (end: EditEnd) => void) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const { apply } = useOutbox();
  const [text, setText] = useState(() => ({
    locator: note.locator ?? '',
    excerpt: note.excerpt ?? '',
    comment: note.comment ?? '',
  }));
  const [tags, setTags] = useState(() => note.tags.map((tag) => tag.name));
  // The Source chosen in the Kaynak field; the Note moves there on save.
  const [moveTo, setMoveTo] = useState<PickedSource | null>(null);
  const currentSource = useQuery({ ...trpc.sources.get.queryOptions({ id: note.sourceId }), enabled: !sourceGone });
  const shownSource = moveTo ?? (sourceGone ? null : (currentSource.data ?? null));
  // Saving or deleting, and which of them failed.
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const [failed, setFailed] = useState<'save' | 'delete' | null>(null);

  const changed =
    moveTo !== null ||
    text.locator !== (note.locator ?? '') ||
    text.excerpt !== (note.excerpt ?? '') ||
    text.comment !== (note.comment ?? '') ||
    tags.length !== note.tags.length ||
    tags.some((name, i) => name !== note.tags[i]?.name);
  const hasText = text.excerpt.trim() !== '' || text.comment.trim() !== '';
  const canSave = hasText && busy === null;

  // Through the outbox: sent now, or kept until the connection returns.
  const update = async () => {
    setBusy('save');
    setFailed(null);
    try {
      await apply({ type: 'updateNote', id: note.id, ...text, tags });
      const moved = moveTo && (await apply({ type: 'moveNote', id: note.id, sourceId: moveTo.id }));
      onEnd({ saved: { sourceId: moveTo?.id ?? note.sourceId } });
      if (moveTo && moved) offerReceiptUndo(t('deletion.noteMoved', { title: moveTo.title }), moved.undo);
    } catch {
      setFailed('save');
    } finally {
      setBusy(null);
    }
  };

  // Notu sil: no question asked, Geri al instead.
  const remove = async () => {
    setBusy('delete');
    setFailed(null);
    try {
      const { undo } = await apply({ type: 'deleteNote', id: note.id });
      onEnd({ deleted: true });
      offerReceiptUndo(t('deletion.noteDeleted'), undo);
    } catch {
      setFailed('delete');
    } finally {
      setBusy(null);
    }
  };

  return {
    text,
    setText,
    tags,
    setTags,
    /** The Source the Kaynak field shows: the one chosen, or the Note's own; none when it was deleted. */
    shownSource,
    /** Its Source was deleted and none is chosen yet: the field asks for a new one. */
    sourceLost: !shownSource && sourceGone,
    /** A Source chosen in the Kaynak field; the Note's own (unless deleted) undoes the choice. */
    chooseSource: (picked: PickedSource) => setMoveTo(picked.id === note.sourceId && !sourceGone ? null : picked),
    /** The draft differs from the Note. */
    changed,
    hasText,
    canSave,
    busy,
    failed,
    save: () => canSave && void update(),
    remove: () => void remove(),
  };
}
