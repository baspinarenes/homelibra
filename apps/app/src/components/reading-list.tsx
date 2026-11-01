import { formatDate } from '@homelibra/core/date';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeDivider } from '@/components/home-divider';
import { SourceCover } from '@/components/source-cover';
import { elapsed } from '@/lib/elapsed';
import { useTRPC } from '@/lib/trpc';

/** Genel Bakış shows this many; "Tümü ›" opens Kaynaklar for the rest. */
const shownCount = 6;

/**
 * Genel Bakış's Okunuyor (story 162): the Sources being read, the last noted
 * first, without the one Kaldığın yer already shows. A row opens the
 * Source page. Nothing when no other Source is being read.
 */
export function ReadingList({ exceptId }: { exceptId: string | undefined }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const reading = useQuery(trpc.sources.reading.queryOptions());
  const sources = reading.data?.filter((source) => source.id !== exceptId) ?? [];
  if (sources.length === 0) return null;

  return (
    <>
      <HomeDivider />
      <View style={styles.section}>
        <View style={styles.head}>
          <SectionHeading
            title={t('readingStatus.readingSection')}
            link={{ label: t('readingStatus.all'), onPress: () => router.navigate('/sources') }}
          />
        </View>
        {sources.slice(0, shownCount).map((source, index) => {
          const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
          return (
            <Pressable
              key={source.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
              style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
            >
              <SourceCover type={source.type} cover={source.cover} />
              <View style={styles.text}>
                <Text style={styles.title} numberOfLines={2}>
                  {source.title}
                </Text>
                {byline !== '' && (
                  <Text style={styles.byline} numberOfLines={1}>
                    {byline}
                  </Text>
                )}
              </View>
              {source.lastNoteAt && <Text style={styles.when}>{elapsed(t, source.lastNoteAt)}</Text>}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // Under Kaldığın yer, the HomeDivider between.
    section: { paddingVertical: 22 },
    head: { paddingBottom: space.xs },
    pressed: { opacity: 0.7 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    text: { flex: 1, gap: 2 },
    title: { ...typeScale.sourceTitleSm, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
    when: { ...typeScale.locator, fontSize: 11.5, color: c.muted },
  });
