import type { KnownNote } from '@homelibra/outbox';
import { NoteRow as WideNoteRow } from '@homelibra/ui/note-row';
import { Text } from '@homelibra/ui/text';
import type { Density } from '@homelibra/ui/wide-layout';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { usePressedRowAnchor } from '@/components/pressed-row-anchor';

/**
 * The lost Notes beside the panel, in @homelibra/ui's rows as a
 * Collection's (ADR-0012): the title and the lead in the list's head, the
 * rows in `density`, the one the panel edits framed. As in a Collection,
 * the row pressed stays where it stood while the rows go compact under it.
 */
export function WideLostList({
  notes,
  density,
  focusId,
  onOpen,
}: {
  notes: readonly KnownNote[];
  density: Density;
  focusId: string | null;
  onOpen: (id: string) => void;
}) {
  const { t } = useTranslation();
  const list = useRef<FlatList<KnownNote>>(null);
  const anchor = usePressedRowAnchor({
    density,
    focused: focusId,
    focusRow: false,
    panelOpen: focusId !== null,
    scrollTo: (offset) => list.current?.scrollToOffset({ offset, animated: false }),
    reveal: (id) => {
      const index = notes.findIndex((note) => note.id === id);
      if (index >= 0) list.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false });
    },
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
          extraData={[density, focusId]}
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
                selected={note.id === focusId}
                divided={index > 0}
                hint={t('sourcePage.editNote')}
                labels={{ withComment: t('widePanel.withComment') }}
                onPress={() => anchor.press(note.id, () => onOpen(note.id))}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}
