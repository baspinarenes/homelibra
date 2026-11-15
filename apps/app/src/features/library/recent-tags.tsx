import { Chip, ChipRow } from '@homelibra/ui/chip';
import { Section, SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { HomeDivider } from '@/features/library/home-divider';
import { WideSectionBody } from '@/features/library/last-noted';
import { useTRPC } from '@/lib/trpc';

/** Genel Bakış shows this many Tags; "Tümü ›" opens Etiketler for the rest. */
const shownCount = 8;

/**
 * Genel Bakış's "Son kullanılan etiketler" (story 162): a flat, unboxed list of
 * the Tags put on last, each with "N not · M kaynak". Nothing while the
 * Library has no Tags. `wide` (#182): a section of a wide Genel Bakış's side
 * column, inside `<Sections wide>`, the Tags as chips with "Tümü ›" after them.
 */
export function RecentTags({ wide = false }: { wide?: boolean }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const tags = useQuery(trpc.tags.list.queryOptions({ sort: 'recent', limit: shownCount }));
  if (!tags.data?.length) return null;
  const open = (id: string) => router.push({ pathname: '/tag/[id]', params: { id } });
  const all = () => router.navigate({ pathname: '/collections', params: { view: 'tags' } });

  if (wide)
    return (
      <Section title={t('tags.recent')}>
        <WideSectionBody>
          <ChipRow>
            {tags.data.map((tag) => (
              <Chip key={tag.id} label={tag.name} onPress={() => open(tag.id)} />
            ))}
            <Pressable role="button" onPress={all} hitSlop={8} className="self-center active:opacity-70">
              <Text variant="link">{t('tags.all')}</Text>
            </Pressable>
          </ChipRow>
        </WideSectionBody>
      </Section>
    );

  return (
    <>
      <HomeDivider />
      {/* Under Okunuyor or Kaldığın yer, the HomeDivider between. */}
      <View className="py-5.5">
        <View className="pb-xs">
          <SectionHeading title={t('tags.recent')} link={{ label: t('tags.all'), onPress: all }} />
        </View>
        {tags.data.map((tag, index) => (
          <Pressable
            key={tag.id}
            accessibilityRole="link"
            onPress={() => open(tag.id)}
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
