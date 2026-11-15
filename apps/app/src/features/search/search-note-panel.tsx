import { formatDate } from '@homelibra/core/date';
import { NotePanel } from '@homelibra/ui/note-panel';
import { Panel } from '@homelibra/ui/panel';
import { useTheme } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { copyNoteMarkdown } from '@/features/collection/collection-actions';
import { useLeave } from '@/components/wide-frame';
import { PanelNoteEdit } from '@/features/collection/collection-note-panel';
import { type NoteFocus, placeInSource, siblingsOf } from '@/features/collection/note-focus';
import { useTRPC } from '@/lib/trpc';

/**
 * A wide Ara's note panel (#174), @homelibra/ui's NotePanel as a
 * Collection's: the Note `focus` names, walked through its Source's Notes
 * from notes.list, and the Source's other Notes, all plain as the board
 * has them (a search ranks Notes, it holds no view to fall outside). A search result has no Source type or Date,
 * so the Source comes from sources.get. While `editing` (`useNoteEditing`),
 * the Note is edited in the panel in place of its detail (#176).
 */
export function SearchNotePanel({
  focus,
  editing,
  onEditingChange,
  onFocus,
  onClose,
}: {
  focus: NoteFocus;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  onFocus: (focus: NoteFocus) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const trpc = useTRPC();
  const leave = useLeave();
  const notes = useQuery(trpc.notes.list.queryOptions({ sourceId: focus.sourceId }));
  const source = useQuery(trpc.sources.get.queryOptions({ id: focus.sourceId }));
  const note = notes.data?.find((n) => n.id === focus.noteId) ?? null;
  // The Note was deleted, or its Source: the panel closes, the list widens.
  const gone = notes.isError || source.isError || (notes.isSuccess && !note);
  useEffect(() => {
    if (gone) onClose();
  }, [gone, onClose]);

  if (!note || !source.data || !notes.data) {
    return (
      <Panel label={t('widePanel.panel')} head={null} closeLabel={t('widePanel.close')} onClose={onClose}>
        <View className="p-xl">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Panel>
    );
  }
  const from = source.data;
  const go = (noteId: string) => onFocus({ sourceId: focus.sourceId, noteId });

  return (
    <NotePanel
      note={{
        locator: note.locator,
        excerpt: note.excerpt,
        comment: note.comment,
        tags: note.tags.map((tag) => tag.name),
      }}
      source={{
        type: t(`sourceTypes.${from.type}.label`),
        title: [from.author, from.title].filter(Boolean).join(', '),
        date: from.date ? formatDate(from.date) : t('collection.undated'),
      }}
      // While it is edited, only the Note: nothing to walk away to.
      place={editing ? undefined : (placeInSource(notes.data, note.id) ?? undefined)}
      siblings={editing ? undefined : siblingsOf(notes.data, note.id, () => true)}
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
        // Never shown: every sibling is in view here.
        notInView: t('widePanel.notInView'),
      }}
      onGo={go}
      onCopy={() =>
        copyNoteMarkdown(from, note, {
          done: t('collectionActions.copied', { count: 1 }),
          failed: t('collectionActions.copyFailed'),
        })
      }
      onEdit={() => onEditingChange(true)}
      onOpenSource={() => router.push({ pathname: '/source/[id]', params: { id: from.id, note: note.id } })}
      // ✕ over an edit with changes asks first.
      onClose={() => leave(onClose)}
    >
      {/* Undefined, not false, while not editing: then the panel shows the Note's detail. */}
      {editing ? (
        <PanelNoteEdit focus={focus} onEditingChange={onEditingChange} onFocus={onFocus} onClose={onClose} />
      ) : undefined}
    </NotePanel>
  );
}
