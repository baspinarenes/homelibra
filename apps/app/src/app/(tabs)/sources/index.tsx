import { Button } from '@homelibra/ui/button';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { TextTabs } from '@homelibra/ui/text-tabs';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { DateFilter, useDateFilter } from '@/components/date-filter';
import { PrimaryButton } from '@/components/primary-button';
import type { ReadingStatus } from '@/components/reading-status';
import { Segment } from '@/components/segment';
import { SourceListRow } from '@/components/source-list-row';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type Sort = 'last' | 'title' | 'author' | 'date';

/**
 * Kaynaklar: every Source, by Son not (the default), Başlık, Yazar or Tarih,
 * under two tabs by Reading status, Okunuyor (open first) and Bitti, each
 * with its count. The header's Süz icon opens the order and the Tarih filter,
 * and shows a dot while the filter narrows the list; the filter hides the
 * undated and says how many. A row opens the Source page, where its Notes
 * are captured.
 */
export default function SourcesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const [sort, setSort] = useState<Sort>('last');
  const [tab, setTab] = useState<ReadingStatus>('reading');
  const [controlsOpen, setControlsOpen] = useState(false);
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

  if (all.isPending || all.isError || all.data.length === 0) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerRight: () => <HeaderActions onAdd={addSource} /> }} />
        {all.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : all.isError ? (
          <Text style={styles.lead}>{t('sources.loadFailed')}</Text>
        ) : (
          <>
            <Text style={styles.title}>{t('sources.emptyTitle')}</Text>
            <Text style={styles.lead}>{t('sources.emptyLead')}</Text>
            <View style={styles.action}>
              <PrimaryButton label={t('sources.add')} onPress={addSource} />
            </View>
          </>
        )}
      </View>
    );
  }

  const rows = sources.data ?? [];
  const undated = dates.range ? all.data.filter((source) => !source.date).length : 0;
  const reading = rows.filter((source) => source.readingStatus === 'reading');
  const finished = rows.filter((source) => source.readingStatus === 'finished');
  const filterOn = dates.range !== null;

  const empty = () => {
    if (sources.isPending) return <ActivityIndicator color={styles.spinner.color} />;
    if (sources.isError || filterOn) {
      return <Text style={styles.empty}>{t(sources.isError ? 'sources.loadFailed' : 'dateFilter.noSources')}</Text>;
    }
    if (tab === 'finished') return <Text style={styles.empty}>{t('sources.finishedEmpty')}</Text>;
    return (
      <View style={styles.tabEmpty}>
        <Text style={styles.lead}>{t('sources.readingEmpty')}</Text>
        <View style={styles.tabEmptyAction}>
          <Button variant="secondary" label={t('sources.add')} onPress={addSource} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderActions
              filter={{ on: filterOn, onPress: () => setControlsOpen((open) => !open) }}
              onAdd={addSource}
            />
          ),
        }}
      />
      <View style={styles.tabs}>
        <TextTabs
          label={t('sources.statusTabs')}
          options={[
            { value: 'reading', label: t('readingStatus.readingSection'), count: reading.length },
            { value: 'finished', label: t('readingStatus.finishedSection'), count: finished.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={tab === 'reading' ? reading : finished}
        keyExtractor={(source) => source.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          controlsOpen || undated > 0 ? (
            <View style={styles.controls}>
              {controlsOpen && (
                <>
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
                </>
              )}
              {undated > 0 && <Text style={styles.hint}>{t('dateFilter.hiddenSources', { count: undated })}</Text>}
            </View>
          ) : undefined
        }
        ListEmptyComponent={empty()}
        renderItem={({ item: source, index }) => <SourceListRow source={source} divided={index > 0} />}
      />
    </View>
  );
}

/**
 * The header's icons: Süz ve sırala, once there are Sources to narrow, with
 * a dot while the filter is on; then Kaynak ekle.
 */
function HeaderActions({ filter, onAdd }: { filter?: { on: boolean; onPress: () => void }; onAdd: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.headerActions}>
      {filter && (
        <HeaderIconAction
          icon={SlidersHorizontal}
          label={t(filter.on ? 'sources.filterActive' : 'sources.filter')}
          dot={filter.on}
          size={24}
          onPress={filter.onPress}
        />
      )}
      <HeaderIconAction icon={Plus} label={t('sources.add')} size={24} onPress={onAdd} />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    tabs: { paddingHorizontal: space.lg, paddingTop: 2 },
    list: { flex: 1 },
    // Grows so an empty tab's message can sit in the middle.
    content: { flexGrow: 1, paddingHorizontal: space.lg, paddingBottom: space.xxl },
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
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    controls: { gap: space.md, paddingTop: space.md },
    hint: { ...typeScale.caption, color: c.muted },
    tabEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.md,
      paddingHorizontal: space.lg,
    },
    tabEmptyAction: { marginTop: space.xs },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
  });
