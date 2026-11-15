import { SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { HomeDivider } from '@/features/library/home-divider';
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
  const trpc = useTRPC();
  const router = useRouter();
  const tags = useQuery(trpc.tags.list.queryOptions({ sort: 'recent', limit: shownCount }));
  if (!tags.data?.length) return null;

  return (
    <>
      <HomeDivider />
      {/* Under Okunuyor or Kaldığın yer, the HomeDivider between. */}
      <View className="py-5.5">
        <View className="pb-xs">
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
            className={cx(
              'flex-row items-baseline justify-between gap-md py-2.5 active:opacity-70',
              index > 0 && 'border-t border-line-soft',
            )}
          >
            <Text variant="body" color="fg" className="shrink">
              {tag.name}
            </Text>
            <Text variant="count">{t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount })}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
