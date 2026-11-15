import type { SourceType } from '@homelibra/core/source';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { coverColors, useTheme } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Trans, useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { HomeDivider } from '@/features/library/home-divider';
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
  const { colors } = useTheme();
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
      <View className="gap-3.5 py-5.5">
        <SectionHeading
          title={t('home.libraryTitle')}
          link={{ label: t('readingStatus.all'), onPress: () => router.navigate('/sources') }}
        />
        <Text variant="summary">
          <Trans
            i18nKey="home.librarySentence"
            values={{
              sources: sourceCount.toLocaleString('tr-TR'),
              notes: (noteCount + waiting).toLocaleString('tr-TR'),
              tags: tagCount.toLocaleString('tr-TR'),
            }}
            components={{ count: <Text variant="strongSerif" color="fg" /> }}
          />
        </Text>
        <View className="h-px bg-line-soft" />
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
            // Okuma durumu's two colours: the accent for what is being read.
            .map((part) => ({ ...part, color: part.key === 'reading' ? colors.accent : colors.faint }))}
        />
      </View>
    </>
  );
}

type Part = { key: string; label: string; count: number; color: string; onPress: () => void };

/** A bar split by count, 2 between the parts, and under it a legend whose rows are what is pressed. */
function Breakdown({ title, parts }: { title: string; parts: Part[] }) {
  return (
    <View className="gap-2.5">
      <Text variant="micro">{title}</Text>
      <View className="h-2 flex-row gap-0.5">
        {parts.map((part) => (
          <View key={part.key} className="rounded-cover" style={{ flex: part.count, backgroundColor: part.color }} />
        ))}
      </View>
      <View className="flex-row flex-wrap gap-x-4.5 gap-y-2">
        {parts.map((part) => (
          <Pressable
            key={part.key}
            role="link"
            aria-label={`${part.label} ${part.count}`}
            onPress={part.onPress}
            hitSlop={8}
            className="flex-row items-center gap-1.5 active:opacity-70"
          >
            <View className="h-2 w-2 rounded-cover" style={{ backgroundColor: part.color }} />
            <Text variant="label" color="ink3">
              {part.label}
            </Text>
            <Text variant="count">{part.count}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
