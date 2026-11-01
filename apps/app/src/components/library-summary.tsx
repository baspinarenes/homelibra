import type { SourceType } from '@homelibra/core/source';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { type Colors, coverColors, radius, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HomeDivider } from '@/components/home-divider';
import { useOutbox } from '@/lib/outbox';
import { useTRPC } from '@/lib/trpc';

/**
 * Genel Bakış's Kütüphanen (#71), last, unboxed: one serif sentence of the
 * kaynak, not and etiket counts, then two bars with their legends, Kaynak
 * dağılımı in the cover colours and Okuma durumu. A Tür's legend row opens
 * Kaynaklar narrowed to it, Okunuyor and Bitti open their tab. On the phone
 * the Notes still in the outbox count too. Nothing while the Library has no Source.
 */
export function LibrarySummary() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const library = useQuery(trpc.sources.library.queryOptions());
  const waiting = useOutbox().state.pending.filter((operation) => operation.type === 'createNote').length;
  if (!library.data || library.data.sourceCount === 0) return null;
  const { sourceCount, noteCount, tagCount, types, reading, finished } = library.data;
  const toSources = (params: { tab?: string; type?: SourceType }) => router.navigate({ pathname: '/sources', params });

  return (
    <>
      <HomeDivider />
      <View style={styles.section}>
        <SectionHeading
          title={t('home.libraryTitle')}
          link={{ label: t('readingStatus.all'), onPress: () => router.navigate('/sources') }}
        />
        <Text style={styles.sentence}>
          <Trans
            i18nKey="home.librarySentence"
            values={{
              sources: sourceCount.toLocaleString('tr-TR'),
              notes: (noteCount + waiting).toLocaleString('tr-TR'),
              tags: tagCount.toLocaleString('tr-TR'),
            }}
            components={{ count: <Text style={styles.count} /> }}
          />
        </Text>
        <View style={styles.rule} />
        <Breakdown
          title={t('home.libraryTypes')}
          parts={types.map(({ type, count }) => ({
            key: type,
            label: t(`sourceTypes.${type}.label`),
            count,
            color: coverColors[type],
            onPress: () => toSources({ type }),
          }))}
        />
        <Breakdown
          title={t('home.libraryStatus')}
          parts={[
            {
              key: 'reading',
              label: t('readingStatus.readingSection'),
              count: reading,
              onPress: () => toSources({ tab: 'reading' }),
            },
            {
              key: 'finished',
              label: t('readingStatus.finishedSection'),
              count: finished,
              onPress: () => toSources({ tab: 'finished' }),
            },
          ]
            .filter((part) => part.count > 0)
            .map((part) => ({ ...part, color: part.key === 'reading' ? styles.reading.color : styles.finished.color }))}
        />
      </View>
    </>
  );
}

type Part = { key: string; label: string; count: number; color: string; onPress: () => void };

/** A bar split by count, 2 between the parts, and under it a legend whose rows are what is pressed. */
function Breakdown({ title, parts }: { title: string; parts: Part[] }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.breakdown}>
      <Text style={styles.breakdownTitle}>{title.toLocaleUpperCase('tr')}</Text>
      <View style={styles.bar}>
        {parts.map((part) => (
          <View key={part.key} style={[styles.barPart, { flex: part.count, backgroundColor: part.color }]} />
        ))}
      </View>
      <View style={styles.legend}>
        {parts.map((part) => (
          <Pressable
            key={part.key}
            role="link"
            aria-label={`${part.label} ${part.count}`}
            onPress={part.onPress}
            hitSlop={8}
            style={({ pressed }) => [styles.legendRow, pressed && styles.pressed]}
          >
            <View style={[styles.swatch, { backgroundColor: part.color }]} />
            <Text style={styles.legendLabel}>{part.label}</Text>
            <Text style={styles.legendCount}>{part.count}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    section: { gap: 14, paddingVertical: 22 },
    pressed: { opacity: 0.7 },
    sentence: { ...typeScale.summary, color: c.ink2 },
    count: { ...typeScale.strongSerif, color: c.fg },
    rule: { height: 1, backgroundColor: c.lineSoft },
    breakdown: { gap: 10 },
    breakdownTitle: { ...typeScale.micro, color: c.muted },
    bar: { flexDirection: 'row', gap: 2, height: 8 },
    barPart: { borderRadius: radius.cover },
    legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 8 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    swatch: { width: 8, height: 8, borderRadius: radius.cover },
    legendLabel: { ...typeScale.label, color: c.ink3 },
    legendCount: { ...typeScale.count, color: c.muted },
    // Okuma durumu's two colours: the accent for what is being read.
    reading: { color: c.accent },
    finished: { color: c.faint },
  });
