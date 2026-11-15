import { Text } from '@homelibra/ui/text';
import { cx, useTheme } from '@homelibra/ui/theme';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { ListMessage } from '@/components/list-message';
import { TagActions, TagMenuButton, type TagRef } from '@/features/tag/tag-actions';
import type { TagSort } from '@/features/collection/dizin-sort';
import { useTRPC } from '@/lib/trpc';

/** Every Tag in `sort`'s order; the rows stay on screen while another order loads. */
export function useTags(sort: TagSort) {
  const trpc = useTRPC();
  return useQuery({ ...trpc.tags.list.queryOptions({ sort }), placeholderData: keepPreviousData });
}

/**
 * Etiketler in Dizin (#49, #127): every Tag in the Library, Çok kullanılan
 * or Ada göre as chosen under Sırala, each with "N not · M kaynak", and ⋯ to
 * rename, merge or delete one (#50). A row opens the Tag's page, a temporary
 * Collection (#51).
 */
export function TagList({ sort }: { sort: TagSort }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tags = useTags(sort);
  const router = useRouter();
  const [acting, setActing] = useState<TagRef | null>(null);

  return (
    <View className="flex-1">
      {tags.isPending ? (
        <ActivityIndicator className="mt-xl" color={colors.accent} />
      ) : tags.isError ? (
        <ListMessage
          lead={t('tags.loadFailed')}
          action={{ label: t('collections.retry'), variant: 'text', onPress: () => void tags.refetch() }}
        />
      ) : (
        <FlatList
          contentContainerClassName="grow px-gutter pt-xs pb-xxl"
          data={tags.data}
          keyExtractor={(tag) => tag.id}
          ListEmptyComponent={
            <ListMessage title={t('collections.tagsEmptyTitle')} lead={t('collections.tagsEmptyLead')} />
          }
          renderItem={({ item: tag, index }) => (
            <View
              className={cx(
                'flex-row items-center justify-between gap-md py-1.5',
                index > 0 && 'border-t border-line-soft',
              )}
            >
              {/* The Tag's page opens from all of the row but its ⋯; the counts stand right after the name. */}
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push({ pathname: '/tag/[id]', params: { id: tag.id } })}
                className="min-w-0 flex-1 flex-row items-baseline gap-2.5 py-sm active:opacity-70"
              >
                <Text variant="body" color="fg" className="shrink">
                  {tag.name}
                </Text>
                <Text variant="count">{t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount })}</Text>
              </Pressable>
              <TagMenuButton name={tag.name} onPress={() => setActing({ id: tag.id, name: tag.name })} />
            </View>
          )}
        />
      )}
      <TagActions key={acting?.id} tag={acting} onClose={() => setActing(null)} />
    </View>
  );
}
