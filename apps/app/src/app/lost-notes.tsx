import { pendingNote } from '@homelibra/outbox';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { knownNotes } from '@/lib/known-notes';
import { useOutbox } from '@/lib/outbox';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Kaynağı silinmiş (#36, #58): the phone's Notes whose Source was deleted
 * elsewhere while they waited to be sent. None is dropped: each opens in
 * note editing, where a new Source in the Kaynak field sends it there, or
 * "Notu sil" lets it go.
 */
export default function LostNotesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
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
        renderItem={({ item: note, index }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('sourcePage.editNote')}
            onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
            style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
          >
            <Text style={styles.locator}>{note.locator ?? '—'}</Text>
            <View style={styles.texts}>
              {note.excerpt && (
                <Text style={styles.excerpt} numberOfLines={4}>
                  {note.excerpt}
                </Text>
              )}
              {note.comment && <Text style={styles.comment} numberOfLines={4}>{`↳ ${note.comment}`}</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    lead: { ...typeScale.body, color: c.ink2, paddingTop: space.sm, paddingBottom: space.lg },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
    row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    pressed: { opacity: 0.7 },
    locator: { ...typeScale.locator, color: c.muted, width: 84, paddingTop: 4 },
    texts: { flex: 1, gap: 6 },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
  });
