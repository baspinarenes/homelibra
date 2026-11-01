import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ListMessage } from '@/components/list-message';
import type { CollectionSort } from '@/lib/dizin-sort';
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
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const collections = useCollections(sort);

  if (collections.isPending) return <ActivityIndicator style={styles.status} color={styles.spinner.color} />;
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
      contentContainerStyle={styles.content}
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
          style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
        >
          <View style={styles.texts}>
            <Text style={styles.name}>{collection.name}</Text>
            <Text style={collection.tags.length ? styles.tags : styles.untagged}>
              {collection.tags.length ? collection.tags.map((tag) => tag.name).join(' · ') : t('collection.noTags')}
            </Text>
          </View>
          <Text style={styles.count}>{t('collection.noteCount', { count: collection.noteCount })}</Text>
        </Pressable>
      )}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { flexGrow: 1, paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xxl },
    status: { marginTop: space.xl },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    texts: { flex: 1, minWidth: 0, gap: 3 },
    name: { ...typeScale.sourceTitleSm, color: c.fg },
    tags: { ...typeScale.caption, color: c.chipInk },
    untagged: { ...typeScale.caption, color: c.muted2 },
    count: { ...typeScale.locator, fontSize: 12, lineHeight: 16, color: c.muted },
  });
