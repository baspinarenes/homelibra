import { formatDate } from '@homelibra/core/date';
import { NotePanel } from '@homelibra/ui/note-panel';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { copyNoteMarkdown } from '@/features/collection/collection-actions';
import type { ViewData } from '@/features/collection/collection-view';
import { type NoteFocus, placeInSource, siblingsOf } from '@/features/collection/note-focus';
import { NoteEditInPlace } from '@/features/note/note-edit-in-place';
import { useTRPC } from '@/lib/trpc';

type SourceNotes = { id: string; locator: string | null; excerpt: string | null; comment: string | null }[];

/** The Note `focus` names and its Source, from its Source's Notes once they came, from the view until then. */
export function focusedNote(view: ViewData, focus: NoteFocus, sourceNotes: SourceNotes | undefined) {
  const group = view.groups.find((g) => g.source.id === focus.sourceId);
  const note =
    sourceNotes?.find((n) => n.id === focus.noteId) ?? group?.notes.find((n) => n.id === focus.noteId) ?? null;
  return { source: group?.source ?? null, note };
}

/**
 * Whether the panel's Note is being edited in place (#176): only ever the
 * Note in `focus`, so moving the focus elsewhere ends the edit. While it is
 * `editing`, the screen hears no keys of its own: the edit hears ⌘↵ and Esc.
 */
export function useNoteEditing(focus: NoteFocus | null) {
  const [noteId, setNoteId] = useState<string | null>(null);
  if (noteId !== null && noteId !== focus?.noteId) setNoteId(null);
  return {
    editing: noteId !== null,
    setEditing: (on: boolean) => setNoteId(on && focus ? focus.noteId : null),
  };
}

/**
 * The note panel of a wide view of Notes (a Collection, later a Tag's
 * page): the Note `focus` names, walked through its Source's Notes from
 * notes.list, and the Source's other Notes, those not in `view` faded.
 * While `editing` (`useNoteEditing`), the Note is edited in the panel in
 * place of its detail: saved, the panel shows it again, at its new Source
 * if it moved; deleted, the panel closes.
 */
export function ViewNotePanel({
  view,
  focus,
  editing,
  onEditingChange,
  onFocus,
  onClose,
}: {
  view: ViewData;
  focus: NoteFocus;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onFocus: (focus: NoteFocus) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const trpc = useTRPC();
  const notes = useQuery(trpc.notes.list.queryOptions({ sourceId: focus.sourceId }));
  const { source, note } = focusedNote(view, focus, notes.data);
  const gone = !notes.isPending && (!source || !note);
  // The Note was deleted, or its Source left the view (Kaynak notları off): the panel closes, the list widens.
  useEffect(() => {
    if (gone) onClose();
  }, [gone, onClose]);
  if (!source || !note) return null;
  const inView = new Set(view.groups.flatMap((group) => group.notes.map((n) => n.id)));
  const tags = notes.data?.find((n) => n.id === note.id)?.tags.map((tag) => tag.name) ?? [];
  const go = (noteId: string) => onFocus({ sourceId: focus.sourceId, noteId });

  return (
    <NotePanel
      note={{ locator: note.locator, excerpt: note.excerpt, comment: note.comment, tags }}
      source={{
        type: t(`sourceTypes.${source.type}.label`),
        title: [source.author, source.title].filter(Boolean).join(', '),
        date: source.date ? formatDate(source.date) : t('collection.undated'),
      }}
      // While it is edited, only the Note: nothing to walk away to.
      place={notes.data && !editing ? (placeInSource(notes.data, note.id) ?? undefined) : undefined}
      siblings={notes.data && !editing ? siblingsOf(notes.data, note.id, (id) => inView.has(id)) : undefined}
      labels={{
        panel: t('widePanel.panel'),
        close: t('widePanel.close'),
        previous: t('widePanel.previous'),
        next: t('widePanel.next'),
        place: (n, total) => t('widePanel.place', { n, total }),
        copy: t('widePanel.copy'),
        edit: t('widePanel.edit'),
        openSource: t('widePanel.openSource'),
        siblings: t('widePanel.siblings'),
        notInView: t('widePanel.notInView'),
      }}
      onGo={go}
      onCopy={() =>
        copyNoteMarkdown(source, note, {
          done: t('collectionActions.copied', { count: 1 }),
          failed: t('collectionActions.copyFailed'),
        })
      }
      onEdit={() => onEditingChange(true)}
      onOpenSource={() => router.push({ pathname: '/source/[id]', params: { id: source.id, note: note.id } })}
      onClose={onClose}
    >
      {/* Undefined, not false, while not editing: then the panel shows the Note's detail. */}
      {editing ? (
        <NoteEditInPlace
          id={note.id}
          onEnd={(end) => {
            onEditingChange(false);
            if (end && 'deleted' in end) onClose();
            else if (end && end.saved.sourceId !== focus.sourceId)
              onFocus({ sourceId: end.saved.sourceId, noteId: focus.noteId });
          }}
        />
      ) : undefined}
    </NotePanel>
  );
}
