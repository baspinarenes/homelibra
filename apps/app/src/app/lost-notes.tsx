import { pendingNote } from '@homelibra/outbox';
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { Stack, useRouter } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { knownNotes } from '@/lib/known-notes';
import { useOutbox } from '@/lib/outbox';

/**
 * Kaynağı silinmiş (#36, #58): the phone's Notes whose Source was deleted
 * elsewhere while they waited to be sent. None is dropped: each opens in
 * note editing, where a new Source in the Kaynak field sends it there, or
 * "Notu sil" lets it go.
 */
export default function LostNotesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
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
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t('outbox.lostTitle') }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={notes}
        keyExtractor={(note) => note.id}
        ListHeaderComponent={<Text style={styles.lead}>{t('outbox.lostLead')}</Text>}
        ListEmptyComponent={<Text style={styles.empty}>{t('outbox.lostNone')}</Text>}
        renderItem={({ item: note }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('sourcePage.editNote')}
            onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Text style={styles.locator}>{note.locator ?? '—'}</Text>
            <View style={styles.texts}>
              {note.excerpt && (
                <Text style={styles.excerpt} numberOfLines={3}>
                  {note.excerpt}
                </Text>
              )}
              {note.comment && (
                <Text style={styles.comment} numberOfLines={3}>
                  <Text style={styles.arrow}>↳ </Text>
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.gutter, paddingBottom: space.xxl },
    lead: { ...typeScale.body, color: c.ink2, paddingTop: space.xs, paddingBottom: space.md },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
    // Every row ruled off from what is above it, the lead too.
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: space.md,
      borderTopWidth: 1,
      borderTopColor: c.lineSoft,
    },
    pressed: { opacity: 0.7 },
    locator: { ...typeScale.locator, color: c.muted, width: 68 },
    texts: { flex: 1, gap: 6 },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.comment, color: c.ink3 },
    arrow: { color: c.muted2 },
  });
