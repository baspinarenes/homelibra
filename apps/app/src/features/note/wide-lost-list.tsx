import type { KnownNote } from '@homelibra/outbox';
import { NoteRow as WideNoteRow } from '@homelibra/ui/note-row';
import { KeyHints } from '@homelibra/ui/panel';
import { Text } from '@homelibra/ui/text';
import { type Density, useShortcuts } from '@homelibra/ui/wide-layout';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { usePressedRowAnchor } from '@/components/pressed-row-anchor';
import { lostNoteAction } from '@/features/note/lost-notes';

/**
 * The lost Notes beside the panel, in @homelibra/ui's rows as a
 * Collection's (ADR-0012): the title and the lead in the list's head, the
 * rows in `density`, the one the panel edits framed. As in a Collection,
 * the row pressed stays where it stood while the rows go compact under it.
 *
 * Its keys while `keys` and the panel is closed (`lostNoteAction`): ↑↓
 * choose a row, framed, the focus going with it; ↵ opens it. The panel's
 * edit has the keys while it is open, Esc putting it away; the focus then
 * goes back to the row. With `hints` the keys stand along the list's foot.
 */
export function WideLostList({
  notes,
  density,
  focusId,
  onOpen,
  keys,
  hints,
}: {
  notes: readonly KnownNote[];
  density: Density;
  focusId: string | null;
  onOpen: (id: string) => void;
  keys: boolean;
  hints: boolean;
}) {
  const { t } = useTranslation();
  const list = useRef<FlatList<KnownNote>>(null);
  // The row the keys chose last, or the panel's: ↑↓ go on from it.
  const [chosen, setChosen] = useState<string | null>(null);
  if (focusId !== null && chosen !== focusId) setChosen(focusId);
  // Whether ↑↓ chose it: then the focus follows to its row.
  const [byKeys, setByKeys] = useState(false);
  const panelOpen = focusId !== null;
  const framed = focusId ?? chosen;
  const anchor = usePressedRowAnchor({
    density,
    focused: framed,
    focusRow: byKeys,
    panelOpen,
    scrollTo: (offset) => list.current?.scrollToOffset({ offset, animated: false }),
    reveal: (id) => {
      const index = notes.findIndex((note) => note.id === id);
      if (index >= 0) list.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false });
    },
  });
  const open = (id: string) => anchor.press(id, () => onOpen(id));

  // The panel put away: the focus goes back to its row, so ↑↓ go on from there.
  useEffect(() => {
    if (panelOpen || !chosen) return;
    const frameId = requestAnimationFrame(() => anchor.focus(chosen));
    return () => cancelAnimationFrame(frameId);
    // Only the panel closing asks for this.
  }, [panelOpen]);

  useShortcuts({ panelOpen, active: keys && !panelOpen }, (command) => {
    const action = lostNoteAction(command, { notes, chosen, panelOpen });
    if (!action) return false;
    if ('open' in action) open(action.open);
    else {
      setChosen(action.choose);
      setByKeys(true);
    }
    return true;
  });

  return (
    <View className="flex-1 bg-page">
      <View className="gap-2.5 border-b border-line px-lg pt-sm pb-md">
        <Text variant="sourceTitle" className="pb-0.5">
          {t('outbox.lostTitle')}
        </Text>
        <Text variant="body">{t('outbox.lostLead')}</Text>
      </View>
      <View ref={anchor.frame} collapsable={false} className="flex-1">
        <FlatList
          ref={list}
          className="flex-1 bg-page"
          contentContainerClassName="pb-xxl"
          data={notes}
          keyExtractor={(note) => note.id}
          extraData={[density, framed]}
          onScroll={anchor.onScroll}
          onScrollToIndexFailed={() => {}}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <Text variant="body" className="p-xl text-center">
              {t('outbox.lostNone')}
            </Text>
          }
          renderItem={({ item: note, index }) => (
            <View ref={anchor.row(note.id)} collapsable={false}>
              <WideNoteRow
                ref={anchor.target(note.id)}
                density={density}
                locator={note.locator}
                excerpt={note.excerpt}
                comment={note.comment}
                selected={note.id === framed}
                divided={index > 0}
                hint={t('sourcePage.editNote')}
                labels={{ withComment: t('widePanel.withComment') }}
                onPress={() => {
                  setByKeys(false);
                  open(note.id);
                }}
              />
            </View>
          )}
        />
      </View>
      {hints && notes.length > 0 && (
        <KeyHints
          hints={
            panelOpen
              ? [{ keys: 'Esc', label: t('widePanel.hintClose') }]
              : [
                  { keys: '↑↓', label: t('widePanel.hintRows') },
                  { keys: '↵', label: t('widePanel.hintOpen') },
                ]
          }
        />
      )}
    </View>
  );
}
