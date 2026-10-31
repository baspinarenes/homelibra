import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ListMessage } from '@/components/list-message';
import { TagActions, TagMenuButton, type TagRef } from '@/components/tag-actions';
import type { TagSort } from '@/lib/dizin-sort';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

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
  const styles = useThemedStyles(makeStyles);
  const tags = useTags(sort);
  const router = useRouter();
  const [acting, setActing] = useState<TagRef | null>(null);

  return (
    <View style={styles.screen}>
      {tags.isPending ? (
        <ActivityIndicator style={styles.status} color={styles.spinner.color} />
      ) : tags.isError ? (
        <ListMessage
          lead={t('tags.loadFailed')}
          action={{ label: t('collections.retry'), variant: 'text', onPress: () => void tags.refetch() }}
        />
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={tags.data}
          keyExtractor={(tag) => tag.id}
          ListEmptyComponent={
            <ListMessage title={t('collections.tagsEmptyTitle')} lead={t('collections.tagsEmptyLead')} />
          }
          renderItem={({ item: tag, index }) => (
            <View style={[styles.row, index > 0 && styles.divided]}>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push({ pathname: '/tag/[id]', params: { id: tag.id } })}
                style={({ pressed }) => [styles.open, pressed && styles.pressed]}
              >
                <Text style={styles.name}>{tag.name}</Text>
                <Text style={styles.counts}>
                  {t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount })}
                </Text>
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1 },
    content: { flexGrow: 1, paddingHorizontal: space.gutter, paddingTop: space.xs, paddingBottom: space.xxl },
    status: { marginTop: space.xl },
    spinner: { color: c.accent },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      paddingVertical: 6,
    },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    // The Tag's page opens from all of the row but its ⋯; the counts stand right after the name.
    open: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingVertical: space.sm },
    pressed: { opacity: 0.7 },
    name: { ...typeScale.body, color: c.fg, flexShrink: 1 },
    counts: { ...typeScale.locator, fontSize: 11.5, lineHeight: 16, color: c.muted },
  });
