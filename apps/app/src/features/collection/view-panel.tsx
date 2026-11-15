import { KeyHints } from '@homelibra/ui/panel';
import { Text } from '@homelibra/ui/text';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import { useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SharedUndoBar } from '@/components/undo-bar';
import { type FrameLayout, useFramePanel, useLeave } from '@/components/wide-frame';
import { copyNoteMarkdown } from '@/features/collection/collection-actions';
import { focusedNote, useNoteEditing, ViewNotePanel } from '@/features/collection/collection-note-panel';
import type { ViewData, WideList } from '@/features/collection/collection-view';
import { type NoteFocus, stepInView } from '@/features/collection/note-focus';
import { viewAction } from '@/features/collection/view-keys';
import { ShortWords } from '@/features/search/note-search';
import { useTRPC } from '@/lib/trpc';

/**
 * A wide view of Notes and its note panel, as a Collection and a Tag's page
 * have them (#171, #173): the Note the panel shows (none on entry), its
 * editing (#176), and the keys (`viewAction`): ↑↓ move the panel through
 * the rows of `shown`, the focus going with them, ⌘C copies its Note, ⌘⇧C
 * `copyAll`, E edits it, / `onSearchHere`, Esc takes back the renaming,
 * then the panel, then the search. `view` is the whole view, `shown` what
 * its search leaves of it, `found` whether the search found Notes.
 *
 * Returns the frame's layout, `wideList` for CollectionView's `wide`, `panel`
 * for PanelLayout and `foot`, the keys along the list's foot while the
 * panel is open beside the full sidebar.
 */
export function useViewPanel({
  view,
  shown,
  found,
  searching,
  renaming = false,
  menuOpen,
  copyAll,
  onSearchHere,
  onCloseSearch,
  onCancelRename,
}: {
  view: ViewData;
  shown: ViewData;
  /** The search found Notes: ⌘⇧C copies those. */
  found: boolean;
  searching: boolean;
  renaming?: boolean;
  /** ⋯ open: its keys are its own. */
  menuOpen: boolean;
  copyAll: () => void;
  onSearchHere: () => void;
  onCloseSearch: () => void;
  onCancelRename?: () => void;
}): {
  layout: FrameLayout;
  wide: boolean;
  panelOpen: boolean;
  wideList: WideList | undefined;
  panel: ReactNode;
  foot: ReactNode;
} {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  // The wide tier's panel: which Note it shows, null while it is closed (as it is on entry).
  const [focus, setFocus] = useState<NoteFocus | null>(null);
  // Whether ↑↓ chose it: then the focus follows to its row. A press or ‹ › keep the focus where they are.
  const [byKeys, setByKeys] = useState(false);
  const focusBy = (keys: boolean) => (to: NoteFocus) => {
    setFocus(to);
    setByKeys(keys);
  };
  // Not al takes the panel's place (#178).
  const layout = useFramePanel(focus !== null, () => setFocus(null));
  // Another row pressed over an edit with changes asks first.
  const leave = useLeave();
  const wide = layout.tier === 'wide';
  const panelOpen = wide && focus !== null;
  const inFront = useIsFocused();
  // While its Note is edited in the panel, the edit hears the keys.
  const { editing, setEditing } = useNoteEditing(focus);
  // The focused Source's Notes as the panel fetched them: a key acts on them at once, the clipboard allows no wait.
  const sourceNotes = (sourceId: string) => queryClient.getQueryData(trpc.notes.list.queryKey({ sourceId }));

  useShortcuts({ panelOpen, active: wide && inFront && !menuOpen && !editing }, (command) => {
    const action = viewAction(command, { panelOpen, renaming, searching, notes: shown.noteCount });
    switch (action) {
      case 'previous':
      case 'next': {
        const order = focus ? sourceNotes(focus.sourceId)?.map((note) => note.id) : undefined;
        const to = stepInView(shown, focus, action, order);
        if (to) focusBy(true)(to);
        return to !== null;
      }
      case 'copyNote': {
        if (!focus) return false;
        const { source, note } = focusedNote(view, focus, sourceNotes(focus.sourceId));
        if (!source || !note) return false;
        copyNoteMarkdown(source, note, {
          done: t('collectionActions.copied', { count: 1 }),
          failed: t('collectionActions.copyFailed'),
        });
        return true;
      }
      case 'copyAll':
        copyAll();
        return true;
      case 'edit':
        if (!focus) return false;
        setEditing(true);
        return true;
      case 'searchHere':
        onSearchHere();
        return true;
      case 'cancelRename':
        onCancelRename?.();
        return true;
      case 'closePanel':
        setFocus(null);
        return true;
      case 'closeSearch':
        onCloseSearch();
        return true;
      default:
        return false;
    }
  });

  // Only keys that act here.
  const keyHints = [
    { keys: '↑↓', label: t('widePanel.hintRows') },
    { keys: '⌘C', label: t('widePanel.hintCopyNote') },
    { keys: '⌘⇧C', label: found ? t('widePanel.hintCopyFound') : t('widePanel.hintCopyAll') },
    ...(searching ? [] : [{ keys: '/', label: t('widePanel.hintSearch') }]),
    { keys: 'Esc', label: t('widePanel.hintClose') },
  ];

  return {
    layout,
    wide,
    panelOpen,
    wideList: wide
      ? { density: layout.density, focus, onOpen: (to) => leave(() => focusBy(false)(to)), focusRow: byKeys }
      : undefined,
    panel: focus && (
      <ViewNotePanel
        view={view}
        focus={focus}
        editing={editing}
        onEditingChange={setEditing}
        onFocus={focusBy(false)}
        onClose={() => setFocus(null)}
      />
    ),
    foot: panelOpen && !editing && layout.sidebar === 'full' && <KeyHints hints={keyHints} />,
  };
}

/** Under a wide search's name and count, which stand on one line: its short words and what failed. */
export function WideSearchNotes({
  shortWords,
  noteCount,
  searchFailed,
  saveFailed,
}: {
  shortWords: readonly string[] | undefined;
  noteCount: number;
  searchFailed: boolean;
  saveFailed: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      {noteCount > 0 && <ShortWords words={shortWords} />}
      {searchFailed && (
        <Text variant="caption" color="danger">
          {t('noteSearch.failed')}
        </Text>
      )}
      {saveFailed && (
        <Text variant="caption" color="danger">
          {t('collection.saveFailed')}
        </Text>
      )}
    </>
  );
}

/** The edge along a view's foot that "Kopyalandı · n not" and failures float above. */
export function UndoBarEdge() {
  return (
    <View pointerEvents="box-none" className="absolute right-0 bottom-0 left-0">
      <SharedUndoBar />
    </View>
  );
}
