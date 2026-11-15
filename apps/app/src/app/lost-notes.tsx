import type { KnownNote } from '@homelibra/outbox';
import { NoteRow as WideNoteRow } from '@homelibra/ui/note-row';
import { Panel, PanelLayout } from '@homelibra/ui/panel';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import type { Density } from '@homelibra/ui/wide-layout';
import { Stack, useRouter } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { usePressedRowAnchor } from '@/components/pressed-row-anchor';
import { SharedUndoBar } from '@/components/undo-bar';
import { useFramePanel, useLeave } from '@/components/wide-frame';
import { knownNotes } from '@/features/note/known-notes';
import { lostNotes, shownLostNote } from '@/features/note/lost-notes';
import { NoteEditInPlace } from '@/features/note/note-edit-in-place';
import { useOutbox } from '@/lib/outbox';

/**
 * Kaynağı silinmiş (#36, #58): the phone's Notes whose Source was deleted
 * elsewhere while they waited to be sent. None is dropped: each opens in
 * note editing, where a new Source in the Kaynak field sends it there, or
 * "Notu sil" lets it go.
 *
 * On a wide screen (#186) it takes a Collection's list and panel: no
 * header, the Notes in full rows in the reading column, and a Note pressed
 * opens beside them in the panel, the rows going compact, already in its
 * editing (the Kaynak field, Notu sil), as the phone's row opens Notu
 * düzenle. Saved, deleted or put away (Esc), the panel closes; a Note no
 * longer lost leaves the list, and with the last one "kalmadı" stands.
 */
export default function LostNotesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { state } = useOutbox();
  const notes = useMemo(() => lostNotes(state, knownNotes()), [state]);
  // The wide tier's panel: the Note it edits, closed on entry and once that Note is no longer lost.
  const [focusId, setFocusId] = useState<string | null>(null);
  const shown = shownLostNote(focusId, notes);
  // Not al takes the panel's place (#178).
  const layout = useFramePanel(shown !== null, () => setFocusId(null));
  // The ✕ or another row over an edit with changes asks first.
  const leave = useLeave();

  if (layout.tier === 'wide')
    return (
      <View className="flex-1">
        <Stack.Screen options={{ title: t('outbox.lostTitle'), headerShown: false }} />
        <PanelLayout
          narrow={layout.sidebar === 'iconRail'}
          beside={layout.capturing}
          panel={
            shown && (
              <Panel
                label={t('widePanel.panel')}
                closeLabel={t('widePanel.close')}
                onClose={() => leave(() => setFocusId(null))}
                head={
                  <Text variant="micro" color="warn" numberOfLines={1}>
                    {t('outbox.sourceGone')}
                  </Text>
                }
              >
                {/* Whatever the edit ends in, the panel closes: the Note saved or deleted has left the list. */}
                <NoteEditInPlace id={shown.id} onEnd={() => setFocusId(null)} />
              </Panel>
            )
          }
        >
          <WideLostList
            notes={notes}
            density={layout.density}
            focusId={shown?.id ?? null}
            onOpen={(id) => leave(() => setFocusId(id))}
          />
        </PanelLayout>
        {/* Geri al after Notu sil floats above this zero-height edge. */}
        <View pointerEvents="box-none" className="absolute right-0 bottom-0 left-0">
          <SharedUndoBar />
        </View>
      </View>
    );

  return (
    <View className="flex-1 bg-page">
      <Stack.Screen options={{ title: t('outbox.lostTitle'), headerShown: true }} />
      <FlatList
        contentContainerClassName="px-gutter pb-xxl"
        data={notes}
        keyExtractor={(note) => note.id}
        ListHeaderComponent={
          <Text variant="body" className="pt-xs pb-md">
            {t('outbox.lostLead')}
          </Text>
        }
        ListEmptyComponent={
          <Text variant="body" className="py-xl text-center">
            {t('outbox.lostNone')}
          </Text>
        }
        renderItem={({ item: note }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('sourcePage.editNote')}
            onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
            // Every row ruled off from what is above it, the lead too.
            className="flex-row items-start gap-2.5 border-t border-line-soft py-md active:opacity-70"
          >
            <Text variant="locator" className="w-17">
              {note.locator ?? '—'}
            </Text>
            <View className="flex-1 gap-1.5">
              {note.excerpt && (
                <Text variant="excerpt" className="border-l-2 border-quote-bar pl-2.75" numberOfLines={3}>
                  {note.excerpt}
                </Text>
              )}
              {note.comment && (
                <Text variant="comment" numberOfLines={3}>
                  <Text variant="comment" color="muted2">
                    ↳{' '}
                  </Text>
                  {note.comment}
                </Text>
              )}
            </View>
            <ChevronRight size={18} color={colors.muted2} />
          </Pressable>
        )}
      />
    </View>
  );
}

/**
 * The lost Notes beside the panel, in @homelibra/ui's rows as a
 * Collection's (ADR-0012): the title and the lead in the list's head, the
 * rows in `density`, the one the panel edits framed. As in a Collection,
 * the row pressed stays where it stood while the rows go compact under it.
 */
function WideLostList({
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
