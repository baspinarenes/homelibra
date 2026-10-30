import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** Ana sayfa shows this many Tags; "Tümü ›" opens Etiketler for the rest. */
const shownCount = 8;

/**
 * Ana sayfa's "Son kullanılan etiketler" (story 162): a flat, unboxed list of
 * the Tags put on last, each with "N not · M kaynak". Nothing while the
 * Library has no Tags.
 */
export function RecentTags() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const tags = useQuery(trpc.tags.list.queryOptions({ sort: 'recent', limit: shownCount }));
  if (!tags.data?.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.label}>{t('tags.recent').toLocaleUpperCase('tr')}</Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate({ pathname: '/collections', params: { view: 'tags' } })}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.all}>{t('tags.all')}</Text>
        </Pressable>
      </View>
      {tags.data.map((tag, index) => (
        <View key={tag.id} style={[styles.row, index > 0 && styles.divided]}>
          <Text style={styles.name}>{tag.name}</Text>
          <Text style={styles.counts}>{t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount })}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    section: { paddingTop: 18 },
    head: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingBottom: space.xs,
    },
    label: { ...typeScale.micro, color: c.accent },
    all: { ...typeScale.button, color: c.accent },
    pressed: { opacity: 0.7 },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: space.md,
      paddingVertical: 10,
    },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    name: { ...typeScale.body, flexShrink: 1, color: c.fg },
    counts: { ...typeScale.locator, fontSize: 11.5, color: c.muted },
  });
