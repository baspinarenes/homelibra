import { formatDate } from '@homelibra/core/date';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { HomeDivider } from '@/features/library/home-divider';
import { SourceCover } from '@/features/source/source-cover';
import { elapsed } from '@/features/library/elapsed';
import { useTRPC } from '@/lib/trpc';

/** Genel Bakış shows this many; "Tümü ›" opens Kaynaklar for the rest. */
const shownCount = 6;

/**
 * Genel Bakış's Okunuyor (story 162): the Sources being read, the last noted
 * first, the one Kaldığın yer shows too, so the list is whole even with one
 * Source. A row opens the Source page. Nothing when no Source is being read.
 */
export function ReadingList() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const reading = useQuery(trpc.sources.reading.queryOptions());
  const sources = reading.data ?? [];
  if (sources.length === 0) return null;

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
              onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
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
