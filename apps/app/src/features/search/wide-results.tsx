import type { AppRouter } from '@homelibra/api';
import { NoteRow as WideNoteRow } from '@homelibra/ui/note-row';
import type { Density } from '@homelibra/ui/wide-layout';
import type { inferRouterOutputs } from '@trpc/server';
import { type ReactElement, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { usePressedRowAnchor } from '@/components/pressed-row-anchor';
import type { NoteFocus } from '@/features/collection/note-focus';
import { resultMeta, resultRow } from '@/features/search/search-results';

type NoteResult = inferRouterOutputs<AppRouter>['search']['library']['notes'][number];

/**
 * A wide Ara's Notes, @homelibra/ui's NoteRow as a Collection's (#171): full
 * rows, compact while the panel is open, the one it shows framed; a press
 * opens the Note in the panel. As in a Collection's view the pressed row
 * stays where it stood on the screen while the rows go compact, and a row
 * the keys move to is brought into view (`usePressedRowAnchor`).
 */
export function WideResults({
  notes,
  density,
  focus,
  onOpen,
  focusRow,
  header,
  footer,
  onEndReached,
}: {
  notes: NoteResult[];
  density: Density;
  focus: NoteFocus | null;
  onOpen: (focus: NoteFocus) => void;
  /** The keys chose `focus` (↑↓): the focus goes to its row too, so the framed row and the focused one agree. */
  focusRow: boolean;
  header: ReactElement;
  footer: ReactElement | undefined;
  onEndReached: () => void;
}) {
  const { t } = useTranslation();
  const list = useRef<FlatList<NoteResult>>(null);
  const focused = focus?.noteId ?? null;
  const anchor = usePressedRowAnchor({
    density,
    focused,
    focusRow,
    panelOpen: focus !== null,
    scrollTo: (offset) => list.current?.scrollToOffset({ offset, animated: false }),
    reveal: (id) => {
      const index = notes.findIndex((note) => note.id === id);
      if (index >= 0) list.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false });
    },
  });

  return (
    <View ref={anchor.frame} collapsable={false} className="flex-1">
      <FlatList
        ref={list}
        className="flex-1 bg-page"
        contentContainerClassName="px-sm pb-xxl"
        keyboardShouldPersistTaps="handled"
        data={notes}
        keyExtractor={(note) => note.id}
        extraData={[density, focused]}
        onScroll={anchor.onScroll}
        scrollEventThrottle={16}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={header}
        renderItem={({ item: note, index }) => (
          <View ref={anchor.row(note.id)} collapsable={false}>
            <WideNoteRow
              ref={anchor.target(note.id)}
              density={density}
              locator={note.locator}
              {...resultRow(note)}
              meta={resultMeta(note, t('search.fromComment'))}
              selected={note.id === focused}
              divided={index > 0}
              hint={t('widePanel.openNote')}
              labels={{ withComment: t('widePanel.withComment') }}
              onPress={() => anchor.press(note.id, () => onOpen({ sourceId: note.sourceId, noteId: note.id }))}
            />
          </View>
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={footer}
      />
    </View>
  );
}
