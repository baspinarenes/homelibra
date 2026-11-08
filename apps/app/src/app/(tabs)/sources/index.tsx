import type { AppRouter } from '@homelibra/api';
import { type CalendarDate, inYearRange } from '@homelibra/core/date';
import { type SourceType, sourceTypes } from '@homelibra/core/source';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Segment } from '@homelibra/ui/segment';
import { Sheet, SheetField } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { TextTabs } from '@homelibra/ui/text-tabs';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { inferRouterInputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import {
  emptyYearRange,
  hasYear,
  type YearRangeDraft,
  YearRangeFields,
  yearRangeLabel,
  yearRangeOf,
} from '@/components/date-filter';
import { ListMessage } from '@/components/list-message';
import type { ReadingStatus } from '@/components/reading-status';
import { SourceListRow } from '@/components/source-list-row';
import { useTRPC } from '@/lib/trpc';

type Sort = inferRouterInputs<AppRouter>['sources']['list']['sort'];

/** What Filtrele ve sırala sets: the order, and the Tür and Tarih filters; a filter with nothing chosen keeps all. */
type Choices = { sort: Sort; types: SourceType[]; dates: YearRangeDraft };

const initial: Choices = { sort: 'last', types: [], dates: emptyYearRange };

/** Whether the Tür or the Tarih filter narrows the list. */
const filtering = ({ types, dates }: Choices) => types.length > 0 || yearRangeOf(dates) !== null;

/** Every filter off, the order and the calendar kept. */
const unfiltered = (choices: Choices): Choices => ({
  ...choices,
  types: [],
  dates: { ...emptyYearRange, calendar: choices.dates.calendar },
});

/** The test the filters put a Source to, by the rule `sources.list` follows: for the sheet's live count. */
function sourceFilter({ types, dates }: Choices) {
  const range = yearRangeOf(dates);
  return (source: { type: SourceType; date: CalendarDate | null }) =>
    (types.length === 0 || types.includes(source.type)) && (!range || inYearRange(source.date, range));
}

/**
 * Kaynaklar: every Source, by Son not (the default), Başlık, Yazar or Tarih,
 * under two tabs by Reading status, Okunuyor (open first) and Bitti, each
 * with its count. The header's Filtrele icon opens Filtrele ve sırala (#122): the
 * order, the Tür filter and the Tarih filter, applied by "N kaynağı göster".
 * While a filter is on the icon has a dot, the tabs count what it keeps,
 * and a chip under them names it, × taking it off; the Tarih filter hides
 * the undated and says how many. A row opens the Source page, where its
 * Notes are captured.
 */
export default function SourcesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const [tab, setTab] = useState<ReadingStatus>('reading');
  const [choices, setChoices] = useState(initial);
  // A link from Genel Bakış's Kütüphanen opens a tab (`tab`) or narrows to one Tür (`type`), the tab kept.
  // Taken into the screen's own state once, then cleared, so the same link works again.
  const link = useLocalSearchParams<{ tab?: string; type?: string }>();
  const linked = link.tab || link.type ? `${link.tab}|${link.type}` : null;
  const [taken, setTaken] = useState<string | null>(null);
  if (linked !== taken) {
    setTaken(linked);
    if (link.tab === 'reading' || link.tab === 'finished') setTab(link.tab);
    const type = sourceTypes.find((known) => known === link.type);
    if (type) setChoices((current) => ({ ...current, types: [type] }));
  }
  useEffect(() => {
    if (linked) router.setParams({ tab: undefined, type: undefined });
  }, [linked, router]);
  // The sheet's choices while it is open; "Kapat" drops them.
  const [draft, setDraft] = useState<Choices | null>(null);
  const { sort, types } = choices;
  const dates = yearRangeOf(choices.dates);
  const filterOn = filtering(choices);
  // Keep the rows on screen while the other order loads.
  const all = useQuery({ ...trpc.sources.list.queryOptions({ sort }), placeholderData: keepPreviousData });
  const filtered = useQuery({
    ...trpc.sources.list.queryOptions({ sort, dates, types: types.length > 0 ? types : null }),
    enabled: filterOn,
    placeholderData: keepPreviousData,
  });
  const sources = filterOn ? filtered : all;
  const addSource = () => router.push('/source/new');

  if (all.isPending || all.isError || all.data.length === 0) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerRight: () => <HeaderActions onAdd={addSource} /> }} />
        {all.isPending ? (
          <ActivityIndicator style={styles.pending} color={styles.spinner.color} />
        ) : all.isError ? (
          <ListMessage lead={t('sources.loadFailed')} />
        ) : (
          <ListMessage
            title={t('sources.emptyTitle')}
            lead={t('sources.emptyLead')}
            action={{ label: t('sources.add'), onPress: addSource }}
          />
        )}
      </View>
    );
  }

  const rows = sources.data ?? [];
  // The Sources of the chosen types that the Tarih filter hides for having no Date.
  const ofTypes = sourceFilter({ ...choices, dates: emptyYearRange });
  const undated = dates ? all.data.filter((source) => !source.date && ofTypes(source)).length : 0;
  const reading = rows.filter((source) => source.readingStatus === 'reading');
  const finished = rows.filter((source) => source.readingStatus === 'finished');
  const clearFilters = () => setChoices(unfiltered(choices));

  const empty = () => {
    if (sources.isPending) return <ActivityIndicator style={styles.pending} color={styles.spinner.color} />;
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

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderActions filter={{ on: filterOn, onPress: () => setDraft(choices) }} onAdd={addSource} />
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
        ListHeaderComponent={
          filterOn ? (
            <View style={styles.filters}>
              <ChipRow>
                {dates && (
                  <Chip
                    label={yearRangeLabel(dates, t('dateFilter.open'))}
                    selected
                    removable
                    onPress={() => setChoices({ ...choices, dates: unfiltered(choices).dates })}
                  />
                )}
                {types.length > 0 && (
                  <Chip
                    label={sourceTypes
                      .filter((type) => types.includes(type))
                      .map((type) => t(`sourceTypes.${type}.label`))
                      .join(', ')}
                    selected
                    removable
                    onPress={() => setChoices({ ...choices, types: [] })}
                  />
                )}
              </ChipRow>
              {undated > 0 && <Text variant="caption">{t('dateFilter.hiddenSources', { count: undated })}</Text>}
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
          if (draft) setChoices(draft);
          setDraft(null);
        }}
        onClose={() => setDraft(null)}
      />
    </View>
  );
}

/**
 * Filtrele ve sırala: Sırala (Son not, Başlık, Yazar, Tarih; no direction),
 * Tür (the nine types, any number chosen) and Tarih (one calendar, two
 * years); Temizle and "N kaynağı göster", N following the choices.
 */
function FilterSheet({
  draft,
  onChange,
  count,
  onApply,
  onClose,
}: {
  /** Null while the sheet is closed. */
  draft: Choices | null;
  onChange: (draft: Choices) => void;
  count: number;
  onApply: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  // The last choices stay on screen while the sheet slides away.
  const [lastDraft, setLastDraft] = useState(draft ?? initial);
  if (draft && draft !== lastDraft) setLastDraft(draft);
  const toggle = (type: SourceType) =>
    onChange({
      ...lastDraft,
      types: lastDraft.types.includes(type)
        ? lastDraft.types.filter((other) => other !== type)
        : [...lastDraft.types, type],
    });
  // A year its calendar does not have (1400 r.) cannot be applied.
  const yearMissing = hasYear(lastDraft.dates) && yearRangeOf(lastDraft.dates) === null;

  return (
    <Sheet
      visible={draft !== null}
      title={t('sources.filter')}
      closeLabel={t('sources.close')}
      onClose={onClose}
      secondary={{
        label: t('sources.clear'),
        onPress: () => onChange(unfiltered(lastDraft)),
        disabled: lastDraft.types.length === 0 && !hasYear(lastDraft.dates),
      }}
      primary={{ label: t('sources.show', { count }), onPress: onApply, disabled: yearMissing }}
    >
      <View style={styles.sheet}>
        <SheetField label={t('sources.sort')}>
          <Segment
            label={t('sources.sort')}
            options={[
              { value: 'last', label: t('sourceList.byLast') },
              { value: 'title', label: t('sources.byTitle') },
              { value: 'author', label: t('sources.byAuthor') },
              { value: 'date', label: t('sources.byDate') },
            ]}
            value={lastDraft.sort}
            onChange={(sort) => onChange({ ...lastDraft, sort })}
            block
          />
        </SheetField>
        <SheetField label={t('sources.types')}>
          <ChipRow>
            {sourceTypes.map((type) => (
              <Chip
                key={type}
                label={t(`sourceTypes.${type}.label`)}
                tone="outline"
                selected={lastDraft.types.includes(type)}
                onPress={() => toggle(type)}
              />
            ))}
          </ChipRow>
        </SheetField>
        <SheetField label={t('sources.dates')}>
          <YearRangeFields value={lastDraft.dates} onChange={(dates) => onChange({ ...lastDraft, dates })} />
        </SheetField>
      </View>
    </Sheet>
  );
}

/**
 * The header's icons: Filtrele ve sırala, once there are Sources to narrow, with
 * a dot while a filter is on; then Kaynak ekle.
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
    // Lines up with the root title.
    tabs: { paddingHorizontal: space.gutter, paddingTop: 2 },
    list: { flex: 1 },
    // Grows so an empty tab's message can sit in the middle.
    content: { flexGrow: 1, paddingHorizontal: space.gutter, paddingBottom: space.xxl },
    pending: { flex: 1 },
    spinner: { color: c.accent },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    filters: { gap: space.sm, paddingTop: space.md },
    sheet: { gap: 18 },
  });
