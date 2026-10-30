import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { DateFilter, useDateFilter } from '@/components/date-filter';
import { PrimaryButton } from '@/components/primary-button';
import { Segment } from '@/components/segment';
import { SourceListRow } from '@/components/source-list-row';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type Sort = 'last' | 'title' | 'author' | 'date';

/**
 * Kaynaklar: every Source, by Son not (the default), Başlık, Yazar or Tarih,
 * narrowed by the Tarih filter, which hides the undated and says how many.
 * A row opens the Source page, where its Notes are captured. Okunuyor/Bitti
 * sections arrive with Reading status (P1).
 */
export default function SourcesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const [sort, setSort] = useState<Sort>('last');
  const dates = useDateFilter();
  // Keep the rows on screen while the other order loads.
  const all = useQuery({ ...trpc.sources.list.queryOptions({ sort }), placeholderData: keepPreviousData });
  const filtered = useQuery({
    ...trpc.sources.list.queryOptions({ sort, dates: dates.range }),
    enabled: dates.range !== null,
    placeholderData: keepPreviousData,
  });
  const sources = dates.range ? filtered : all;
  const addSource = () => router.push('/source/new');

  if (all.isPending || all.isError) {
    return (
      <View style={styles.center}>
        {all.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : (
          <Text style={styles.lead}>{t('sources.loadFailed')}</Text>
        )}
      </View>
    );
  }

  if (all.data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('sources.emptyTitle')}</Text>
        <Text style={styles.lead}>{t('sources.emptyLead')}</Text>
        <View style={styles.action}>
          <PrimaryButton label={t('sources.add')} onPress={addSource} />
        </View>
      </View>
    );
  }

  const rows = sources.data ?? [];
  const undated = dates.range ? all.data.filter((source) => !source.date).length : 0;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={rows}
      keyExtractor={(source) => source.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.controls}>
          <Segment
            label={t('sources.sortLabel')}
            options={[
              { value: 'last', label: t('sourceList.byLast') },
              { value: 'date', label: t('sources.byDate') },
              { value: 'author', label: t('sources.byAuthor') },
              { value: 'title', label: t('sources.byTitle') },
            ]}
            value={sort}
            onChange={setSort}
          />
          <DateFilter draft={dates.draft} onChange={dates.setDraft} />
          <Text style={styles.count}>
            {[
              t('sourceList.count', { count: rows.length }),
              undated > 0 && t('dateFilter.hiddenSources', { count: undated }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      }
      ListEmptyComponent={
        sources.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : (
          <Text style={styles.empty}>{t(sources.isError ? 'sources.loadFailed' : 'dateFilter.noSources')}</Text>
        )
      }
      renderItem={({ item: source, index }) => <SourceListRow source={source} divided={index > 0} />}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space.xl,
      gap: space.sm,
      backgroundColor: c.page,
    },
    title: { ...typeScale.title, color: c.fg, textAlign: 'center' },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    action: { marginTop: space.lg },
    spinner: { color: c.accent },
    controls: { gap: space.md, paddingVertical: space.md },
    count: { ...typeScale.caption, color: c.muted },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
  });
