import { sourceTypes } from '@homelibra/core/source';
import { Button } from '@homelibra/ui/button';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { TextTabs } from '@homelibra/ui/text-tabs';
import { useTheme } from '@homelibra/ui/theme';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Stack, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emptyYearRange, yearRangeOf } from '@/features/search/date-filter';
import { ListMessage } from '@/components/list-message';
import { useFramePanel } from '@/components/wide-frame';
import type { ReadingStatus } from '@/features/source/reading-status';
import {
  type Choices,
  FilterChips,
  FilterPanel,
  FilterSheet,
  filtering,
  noFilters,
  sourceFilter,
  type SourceFilters,
  unfiltered,
} from '@/features/source/source-filter';
import { NewSourcePanel } from '@/features/source/source-form-panel';
import { SourceListRow } from '@/features/source/source-list-row';
import { inOrder, naturalOrder } from '@/features/source/source-order';
import { useSourceOrder } from '@/features/source/source-sort';
import { SourceTable, SourceTableKeys, useRowSelection } from '@/features/source/source-table';
import { useTRPC } from '@/lib/trpc';

/**
 * Kaynaklar: every Source, by Son not (the default), Başlık, Yazar or Tarih,
 * under two tabs by Reading status, Okunuyor (open first) and Bitti, each
 * with its count. The order is kept on this device. On a phone the header's
 * Filtrele icon opens Filtrele ve sırala (#122): the order, the Tür filter
 * and the Tarih filter, applied by "N kaynağı göster". While a filter is on
 * the icon has a dot, the tabs count what it keeps, and a chip under them
 * names it, × taking it off; the Tarih filter hides the undated and says
 * how many. A row opens the Source page, where its Notes are captured.
 * On a wide screen (#179) the list is a table whose column headings choose
 * the order and turn it round; Filtrele keeps only Tür and Tarih and opens
 * in the page; ↑↓ choose a row, ↵ opens it, N opens it ready to write.
 * Kaynak ekle opens the Source form in a panel beside the table (#180),
 * which then shows Tür, Başlık, Yazar and Not only.
 */
export default function SourcesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const trpc = useTRPC();
  const router = useRouter();
  // Yeni kaynak's panel beside the table (#180): closed on entry, as every panel is.
  const [adding, setAdding] = useState(false);
  const { tier, density } = useFramePanel(adding);
  const wide = tier === 'wide';
  const focused = useIsFocused();
  const [tab, setTab] = useState<ReadingStatus>('reading');
  const [filters, setFilters] = useState<SourceFilters>(noFilters);
  const [order, setOrder] = useSourceOrder();
  // A link from Genel Bakış's Kütüphanen opens a tab (`tab`) or narrows to one Tür (`type`), the tab kept.
  // Taken into the screen's own state once, then cleared, so the same link works again.
  const link = useLocalSearchParams<{ tab?: string; type?: string }>();
  const linked = link.tab || link.type ? `${link.tab}|${link.type}` : null;
  const [taken, setTaken] = useState<string | null>(null);
  if (linked !== taken) {
    setTaken(linked);
    if (link.tab === 'reading' || link.tab === 'finished') setTab(link.tab);
    const type = sourceTypes.find((known) => known === link.type);
    if (type) setFilters((current) => ({ ...current, types: [type] }));
  }
  useEffect(() => {
    if (linked) router.setParams({ tab: undefined, type: undefined });
  }, [linked, router]);
  // The phone sheet's choices while it is open; "Kapat" drops them.
  const [draft, setDraft] = useState<Choices | null>(null);
  // The wide Filtrele's while it is open; Filtrele again or Esc drops them.
  const [wideDraft, setWideDraft] = useState<SourceFilters | null>(null);
  const { sort } = order;
  const { types } = filters;
  const dates = yearRangeOf(filters.dates);
  const filterOn = filtering(filters);
  // Keep the rows on screen while the other order loads.
  const all = useQuery({ ...trpc.sources.list.queryOptions({ sort }), placeholderData: keepPreviousData });
  const filtered = useQuery({
    ...trpc.sources.list.queryOptions({ sort, dates, types: types.length > 0 ? types : null }),
    enabled: filterOn,
    placeholderData: keepPreviousData,
  });
  const sources = filterOn ? filtered : all;
  // A phone has no way to turn the order round: there it always runs its own way.
  const rows = inOrder(sources.data ?? [], wide ? order : naturalOrder(sort));
  const reading = rows.filter((source) => source.readingStatus === 'reading');
  const finished = rows.filter((source) => source.readingStatus === 'finished');
  const shown = tab === 'reading' ? reading : finished;
  const addSource = () => (wide ? setAdding(true) : router.push('/source/new'));
  const openSource = (id: string, write = false) =>
    router.push({ pathname: '/source/[id]', params: write ? { id, write: '1' } : { id } });

  const selection = useRowSelection(shown.map((source) => source.id));
  // While the form is open its panel hears the keys.
  useShortcuts({ active: focused && !(wide && adding) }, (command) => {
    if (command === 'previous' || command === 'next') {
      selection.step(command);
      return true;
    }
    if (command === 'open' && selection.selected) {
      openSource(selection.selected);
      return true;
    }
    if (command === 'capture' && selection.selected) {
      openSource(selection.selected, true);
      return true;
    }
    if (command === 'back' && wideDraft) {
      setWideDraft(null);
      return true;
    }
  });

  // Saved, the panel closes on the new Source's row, chosen. Both wide returns put it in the
  // same place, so the first Source coming in, or a list that fails to load, keeps what it holds.
  const panel = wide && adding && (
    <View className="w-[520px]">
      <NewSourcePanel
        active={focused}
        onClose={() => setAdding(false)}
        onSaved={(id) => {
          setAdding(false);
          selection.select(id);
        }}
      />
    </View>
  );

  if (all.isPending || all.isError || all.data.length === 0) {
    const message = all.isPending ? (
      <ActivityIndicator className="flex-1" color={colors.accent} />
    ) : all.isError ? (
      <ListMessage lead={t('sources.loadFailed')} />
    ) : (
      <ListMessage
        title={t('sources.emptyTitle')}
        lead={t('sources.emptyLead')}
        action={{ label: t('sources.add'), onPress: addSource }}
      />
    );
    if (wide) {
      return (
        <View className="flex-1 flex-row bg-page">
          <Stack.Screen options={{ headerShown: false }} />
          <View className={adding ? 'min-w-0 flex-1 border-r border-line' : 'min-w-0 flex-1'}>
            <WideHeader onAdd={addSource} />
            {message}
          </View>
          {panel}
        </View>
      );
    }
    return (
      <View className="flex-1 bg-page">
        <Stack.Screen options={{ headerShown: true, headerRight: () => <HeaderActions onAdd={addSource} /> }} />
        {message}
      </View>
    );
  }

  // The Sources of the chosen types that the Tarih filter hides for having no Date.
  const ofTypes = sourceFilter({ ...filters, dates: emptyYearRange });
  const undated = dates ? all.data.filter((source) => !source.date && ofTypes(source)).length : 0;
  const clearFilters = () => setFilters(unfiltered(filters));

  const empty = () => {
    if (sources.isPending) return <ActivityIndicator className="flex-1" color={colors.accent} />;
    if (sources.isError) return <ListMessage lead={t('sources.loadFailed')} />;
    if (filterOn) {
      return (
        <ListMessage
          lead={t('sources.filterEmpty')}
          action={{ label: t('sources.clearFilter'), variant: 'text', onPress: clearFilters }}
        />
      );
    }
    if (tab === 'finished') return <ListMessage lead={t('sources.finishedEmpty')} />;
    return <ListMessage lead={t('sources.readingEmpty')} action={{ label: t('sources.add'), onPress: addSource }} />;
  };

  const statusTabs = (right?: ReactNode) => (
    <TextTabs
      label={t('sources.statusTabs')}
      options={[
        { value: 'reading', label: t('readingStatus.readingSection'), count: reading.length },
        { value: 'finished', label: t('readingStatus.finishedSection'), count: finished.length },
      ]}
      value={tab}
      onChange={setTab}
      right={right}
    />
  );
  const hiddenUndated = undated > 0 && (
    <Text variant="caption">{t('dateFilter.hiddenSources', { count: undated })}</Text>
  );

  if (wide) {
    return (
      <View className="flex-1 flex-row bg-page">
        <Stack.Screen options={{ headerShown: false }} />
        <View className={adding ? 'min-w-0 flex-1 border-r border-line' : 'min-w-0 flex-1'}>
          <WideHeader
            onAdd={addSource}
            chips={filterOn && <FilterChips filters={filters} onChange={setFilters} named />}
            onFilter={() => setWideDraft(wideDraft ? null : filters)}
          >
            {wideDraft && (
              <FilterPanel
                draft={wideDraft}
                onChange={setWideDraft}
                count={all.data.filter(sourceFilter(wideDraft)).length}
                onApply={() => {
                  setFilters(wideDraft);
                  setWideDraft(null);
                }}
              />
            )}
            {statusTabs(
              <Text variant="caption" color="ink2">
                {t('sourceTable.sortHint')}
              </Text>,
            )}
          </WideHeader>
          <SourceTable
            sources={shown}
            order={order}
            onOrder={setOrder}
            selection={selection}
            onOpen={(id) => openSource(id)}
            header={hiddenUndated ? <View className="px-md pt-sm">{hiddenUndated}</View> : undefined}
            empty={empty()}
            density={density}
          />
          <SourceTableKeys />
        </View>
        {panel}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-page">
      <Stack.Screen
        options={{
          headerShown: true,
          headerRight: () => (
            <HeaderActions filter={{ on: filterOn, onPress: () => setDraft({ ...filters, sort }) }} onAdd={addSource} />
          ),
        }}
      />
      {/* Lines up with the root title. */}
      <View className="px-gutter pt-0.5">{statusTabs()}</View>
      <FlatList
        className="flex-1"
        // Grows so an empty tab's message can sit in the middle.
        contentContainerClassName="grow px-gutter pb-xxl"
        data={shown}
        keyExtractor={(source) => source.id}
        ListHeaderComponent={
          filterOn ? (
            <View className="gap-sm pt-md">
              <FilterChips filters={filters} onChange={setFilters} />
              {hiddenUndated}
            </View>
          ) : undefined
        }
        ListEmptyComponent={empty()}
        renderItem={({ item: source, index }) => <SourceListRow source={source} divided={index > 0} />}
      />
      <FilterSheet
        draft={draft}
        onChange={setDraft}
        count={draft ? all.data.filter(sourceFilter(draft)).length : 0}
        onApply={() => {
          if (draft) {
            const { sort: chosen, ...chosenFilters } = draft;
            // A new order runs its own way; the same one keeps the way a wide screen turned it.
            if (chosen !== sort) setOrder(naturalOrder(chosen));
            setFilters(chosenFilters);
          }
          setDraft(null);
        }}
        onClose={() => setDraft(null)}
      />
    </View>
  );
}

/**
 * A wide Kaynaklar's header in place of the tab's bar: the title, the
 * filters that are on as chips, Filtrele (once there are Sources) and
 * Kaynak ekle; then what `children` adds under it (Filtrele open, the tabs).
 */
function WideHeader({
  onAdd,
  onFilter,
  chips,
  children,
}: {
  onAdd: () => void;
  onFilter?: () => void;
  chips?: ReactNode;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  return (
    // The header bar kept the status bar's inset; without it the title does, 20 under it.
    <View className="gap-sm px-xxl" style={{ paddingTop: top + 20 }}>
      <View className="flex-row items-center gap-sm">
        <Text variant="title" className="flex-1">
          {t('tabs.sources')}
        </Text>
        {chips}
        {onFilter && <Button label={t('sourceTable.filter')} variant="small" onPress={onFilter} />}
        <Button label={t('sources.add')} icon={Plus} onPress={onAdd} />
      </View>
      {children}
    </View>
  );
}

/**
 * The header's icons: Filtrele ve sırala, once there are Sources to narrow, with
 * a dot while a filter is on; then Kaynak ekle.
 */
function HeaderActions({ filter, onAdd }: { filter?: { on: boolean; onPress: () => void }; onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center">
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
