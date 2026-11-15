import { formatDate } from '@homelibra/core/date';
import { Section, SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { HomeDivider } from '@/features/library/home-divider';
import { WideSectionBody } from '@/features/library/last-noted';
import { SourceCover } from '@/features/source/source-cover';
import { elapsed } from '@/features/library/elapsed';
import { useTRPC } from '@/lib/trpc';

/** Genel Bakış shows this many; "Tümü ›" opens Kaynaklar for the rest. */
const shownCount = 6;

/**
 * Genel Bakış's Okunuyor (story 162): the Sources being read, the last noted
 * first, the one Kaldığın yer shows too, so the list is whole even with one
 * Source. A row opens the Source page. Nothing when no Source is being read.
 * `wide` (#182): a section of a wide Genel Bakış's side column, inside
 * `<Sections wide>`, its count in the heading and a row to a line.
 */
export function ReadingList({ wide = false }: { wide?: boolean }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const reading = useQuery(trpc.sources.reading.queryOptions());
  const sources = reading.data ?? [];
  if (sources.length === 0) return null;
  const open = (id: string) => router.push({ pathname: '/source/[id]', params: { id } });

  if (wide)
    return (
      <Section title={t('readingStatus.readingSection')} count={String(sources.length)}>
        <WideSectionBody>
          {sources.slice(0, shownCount).map((source) => (
            <Pressable
              key={source.id}
              role="button"
              onPress={() => open(source.id)}
              className="flex-row items-center gap-2.5 border-b border-line-soft py-2 active:opacity-70"
            >
              <SourceCover type={source.type} cover={source.cover} size="table" />
              <View className="min-w-0 flex-1">
                <Text variant="sourceTitleSm" numberOfLines={1}>
                  {source.title}
                </Text>
                {source.author && (
                  <Text variant="caption" numberOfLines={1}>
                    {source.author}
                  </Text>
                )}
              </View>
              {source.lastNoteAt && <Text variant="count">{elapsed(t, source.lastNoteAt)}</Text>}
            </Pressable>
          ))}
        </WideSectionBody>
      </Section>
    );

  return (
    <>
      <HomeDivider />
      {/* Under Kaldığın yer, the HomeDivider between. */}
      <View className="py-5.5">
        <View className="pb-xs">
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
              onPress={() => open(source.id)}
              className={cx(
                'flex-row items-center gap-3.25 py-md active:opacity-70',
                index > 0 && 'border-t border-line-soft',
              )}
            >
              <SourceCover type={source.type} cover={source.cover} />
              <View className="flex-1 gap-0.5">
                <Text variant="sourceTitleSm" numberOfLines={2}>
                  {source.title}
                </Text>
                {byline !== '' && (
                  <Text variant="caption" numberOfLines={1}>
                    {byline}
                  </Text>
                )}
              </View>
              {source.lastNoteAt && <Text variant="count">{elapsed(t, source.lastNoteAt)}</Text>}
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
