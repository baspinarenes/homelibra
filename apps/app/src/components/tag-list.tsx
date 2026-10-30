import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { Segment } from '@/components/segment';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type Sort = 'name' | 'usage';

/**
 * Etiketler (#49): every Tag in the Library, A–Z or Çok kullanılan, each with
 * "N not · M kaynak". A Tag's own page (a temporary Collection) arrives with #51.
 */
export function TagList() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const [sort, setSort] = useState<Sort>('name');
  const tags = useQuery(trpc.tags.list.queryOptions({ sort }));

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <Segment
          compact
          label={t('tags.sortLabel')}
          options={[
            { value: 'name', label: t('tags.sortName') },
            { value: 'usage', label: t('tags.sortUsage') },
          ]}
          value={sort}
          onChange={setSort}
        />
      </View>
      {tags.isPending ? (
        <ActivityIndicator style={styles.status} color={styles.spinner.color} />
      ) : tags.isError ? (
        <Text style={[styles.lead, styles.status]}>{t('tags.loadFailed')}</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={tags.data}
          keyExtractor={(tag) => tag.id}
          ListEmptyComponent={<Text style={[styles.lead, styles.status]}>{t('tags.empty')}</Text>}
          renderItem={({ item: tag, index }) => (
            <View style={[styles.row, index > 0 && styles.divided]}>
              <Text style={styles.name}>{tag.name}</Text>
              <Text style={styles.counts}>{t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount })}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1 },
    bar: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs },
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    status: { marginTop: space.xl },
    spinner: { color: c.accent },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center', paddingHorizontal: space.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: space.md,
      paddingVertical: space.md,
    },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    name: { ...typeScale.body, flexShrink: 1, color: c.fg },
    counts: { ...typeScale.locator, fontSize: 11.5, color: c.muted },
  });
