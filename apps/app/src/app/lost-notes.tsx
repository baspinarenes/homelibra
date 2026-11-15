import { pendingNote } from '@homelibra/outbox';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { Stack, useRouter } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { knownNotes } from '@/features/note/known-notes';
import { useOutbox } from '@/lib/outbox';

/**
 * Kaynağı silinmiş (#36, #58): the phone's Notes whose Source was deleted
 * elsewhere while they waited to be sent. None is dropped: each opens in
 * note editing, where a new Source in the Kaynak field sends it there, or
 * "Notu sil" lets it go.
 */
export default function LostNotesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { state } = useOutbox();
  const notes = useMemo(() => {
    const known = knownNotes();
    return [...state.status]
      .filter(([, status]) => status === 'sourceGone')
      .flatMap(([id]) => pendingNote(id, state.pending, known) ?? []);
  }, [state]);

  return (
    <View className="flex-1 bg-page">
      <Stack.Screen options={{ title: t('outbox.lostTitle') }} />
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
