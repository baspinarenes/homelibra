import { Text } from '@homelibra/ui/text';
import { cx, useTheme } from '@homelibra/ui/theme';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { ListMessage } from '@/components/list-message';
import type { CollectionSort } from '@/features/collection/dizin-sort';
import { useTRPC } from '@/lib/trpc';

/** Every Collection in `sort`'s order; the rows stay on screen while another order loads. */
export function useCollections(sort: CollectionSort) {
  const trpc = useTRPC();
  return useQuery({ ...trpc.collections.list.queryOptions({ sort }), placeholderData: keepPreviousData });
}

/**
 * Dosyalar in Dizin (#51, #127): every Collection with its Tags and how many
 * Notes it shows now, in the order chosen under Sırala. A row opens the
 * Collection; a new one starts from Dizin's "+" (Yeni dosya, #128).
 */
export function CollectionList({ sort }: { sort: CollectionSort }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const collections = useCollections(sort);

  if (collections.isPending) return <ActivityIndicator className="mt-xl" color={colors.accent} />;
  if (collections.isError) {
    return (
      <ListMessage
        lead={t('collection.listFailed')}
        action={{ label: t('collections.retry'), variant: 'text', onPress: () => void collections.refetch() }}
      />
    );
  }
  return (
    <FlatList
      contentContainerClassName="grow px-gutter pt-xs pb-xxl"
      data={collections.data}
      keyExtractor={(collection) => collection.id}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <ListMessage
          title={t('collections.emptyTitle')}
          lead={t('collections.emptyLead')}
          action={{ label: t('collections.new'), onPress: () => router.push('/collection/new') }}
        />
      }
      renderItem={({ item: collection, index }) => (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/collection/[id]', params: { id: collection.id } })}
          className={cx(
            'flex-row items-center gap-md py-md active:opacity-70',
            index > 0 && 'border-t border-line-soft',
          )}
        >
          <View className="min-w-0 flex-1 gap-0.75">
            <Text variant="sourceTitleSm">{collection.name}</Text>
            <Text variant="caption" color={collection.tags.length ? 'chipInk' : 'muted2'}>
              {collection.tags.length ? collection.tags.map((tag) => tag.name).join(' · ') : t('collection.noTags')}
            </Text>
          </View>
          <Text variant="collectionCount">{t('collection.noteCount', { count: collection.noteCount })}</Text>
        </Pressable>
      )}
    />
  );
}
