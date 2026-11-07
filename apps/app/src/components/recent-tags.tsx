import { SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { HomeDivider } from '@/components/home-divider';
import { useTRPC } from '@/lib/trpc';

/** Genel Bakış shows this many Tags; "Tümü ›" opens Etiketler for the rest. */
const shownCount = 8;

/**
 * Genel Bakış's "Son kullanılan etiketler" (story 162): a flat, unboxed list of
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
    <>
      <HomeDivider />
      <View style={styles.section}>
        <View style={styles.head}>
          <SectionHeading
            title={t('tags.recent')}
            link={{
              label: t('tags.all'),
              onPress: () => router.navigate({ pathname: '/collections', params: { view: 'tags' } }),
            }}
          />
        </View>
        {tags.data.map((tag, index) => (
          <Pressable
            key={tag.id}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/tag/[id]', params: { id: tag.id } })}
            style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
          >
            <Text variant="body" color="fg" style={styles.name}>
              {tag.name}
            </Text>
            <Text variant="count">{t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount })}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // Under Okunuyor or Kaldığın yer, the HomeDivider between.
    section: { paddingVertical: 22 },
    head: { paddingBottom: space.xs },
    pressed: { opacity: 0.7 },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: space.md,
      paddingVertical: 10,
    },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    name: { flexShrink: 1 },
  });
