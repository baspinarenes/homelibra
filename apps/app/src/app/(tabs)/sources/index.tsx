import { type CalendarDate, inYearRange } from '@homelibra/core/date';
import { type SourceType, sourceTypes } from '@homelibra/core/source';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Segment } from '@homelibra/ui/segment';
import { Sheet } from '@homelibra/ui/sheet';
import { TextTabs } from '@homelibra/ui/text-tabs';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import {
  emptyYearRange,
  hasYear,
  type YearRangeDraft,
  YearRangeFields,
  yearRangeLabel,
  yearRangeOf,
} from '@/components/date-filter';
import type { ReadingStatus } from '@/components/reading-status';
import { SourceListRow } from '@/components/source-list-row';
import { useTRPC } from '@/lib/trpc';

type Sort = 'last' | 'title' | 'author' | 'date';

/** What Süz ve sırala sets: the order, and the Tür and Tarih filters; a filter with nothing chosen keeps all. */
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

/** Whether the filters keep a Source, by the rule `sources.list` follows: for the sheet's live count. */
function keeps({ types, dates }: Choices) {
  const range = yearRangeOf(dates);
  return (source: { type: SourceType; date: CalendarDate | null }) =>
    (types.length === 0 || types.includes(source.type)) && (!range || inYearRange(source.date, range));
}

/**
 * Kaynaklar: every Source, by Son not (the default), Başlık, Yazar or Tarih,
 * under two tabs by Reading status, Okunuyor (open first) and Bitti, each
 * with its count. The header's Süz icon opens Süz ve sırala (#122): the
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
              <Button label={t('sources.add')} onPress={addSource} />
            </View>
          </>
        )}
      </View>
    );
  }

  const rows = sources.data ?? [];
  // The Sources of the chosen types that the Tarih filter hides for having no Date.
  const ofTypes = keeps({ ...choices, dates: emptyYearRange });
  const undated = dates ? all.data.filter((source) => !source.date && ofTypes(source)).length : 0;
  const reading = rows.filter((source) => source.readingStatus === 'reading');
  const finished = rows.filter((source) => source.readingStatus === 'finished');
  const clearFilters = () => setChoices(unfiltered(choices));

  const empty = () => {
    if (sources.isPending) return <ActivityIndicator color={styles.spinner.color} />;
    if (sources.isError) return <Text style={styles.empty}>{t('sources.loadFailed')}</Text>;
    if (filterOn) {
      return (
        <View style={styles.tabEmpty}>
          <Text style={styles.lead}>{t('sources.filterEmpty')}</Text>
          <Button variant="text" label={t('sources.clearFilter')} onPress={clearFilters} />
        </View>
      );
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
              {undated > 0 && <Text style={styles.hint}>{t('dateFilter.hiddenSources', { count: undated })}</Text>}
            </View>
          ) : undefined
        }
        ListEmptyComponent={empty()}
        renderItem={({ item: source, index }) => <SourceListRow source={source} divided={index > 0} />}
      />
      <FilterSheet
        draft={draft}
        onChange={setDraft}
        count={draft ? all.data.filter(keeps(draft)).length : 0}
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
 * Süz ve sırala: Sırala (Son not, Başlık, Yazar, Tarih; no direction),
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
  const [shown, setShown] = useState(draft ?? initial);
  if (draft && draft !== shown) setShown(draft);
  const toggle = (type: SourceType) =>
    onChange({
      ...shown,
      types: shown.types.includes(type) ? shown.types.filter((other) => other !== type) : [...shown.types, type],
    });
  // A year its calendar does not have (1400 r.) cannot be applied.
  const yearMissing = hasYear(shown.dates) && yearRangeOf(shown.dates) === null;

  return (
    <Sheet
      visible={draft !== null}
      title={t('sources.filter')}
      closeLabel={t('sources.close')}
      onClose={onClose}
      secondary={{
        label: t('sources.clear'),
        onPress: () => onChange(unfiltered(shown)),
        disabled: shown.types.length === 0 && !hasYear(shown.dates),
      }}
      primary={{ label: t('sources.show', { count }), onPress: onApply, disabled: yearMissing }}
    >
      <View style={styles.sheet}>
        <Field label={t('sources.sort')}>
          <Segment
            label={t('sources.sort')}
            options={[
              { value: 'last', label: t('sourceList.byLast') },
              { value: 'title', label: t('sources.byTitle') },
              { value: 'author', label: t('sources.byAuthor') },
              { value: 'date', label: t('sources.byDate') },
            ]}
            value={shown.sort}
            onChange={(sort) => onChange({ ...shown, sort })}
            block
          />
        </Field>
        <Field label={t('sources.types')}>
          <ChipRow>
            {sourceTypes.map((type) => (
              <Chip
                key={type}
                label={t(`sourceTypes.${type}.label`)}
                tone="outline"
                selected={shown.types.includes(type)}
                onPress={() => toggle(type)}
              />
            ))}
          </ChipRow>
        </Field>
        <Field label={t('sources.dates')}>
          <YearRangeFields value={shown.dates} onChange={(dates) => onChange({ ...shown, dates })} />
        </Field>
      </View>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label.toLocaleUpperCase('tr')}</Text>
      {children}
    </View>
  );
}

/**
 * The header's icons: Süz ve sırala, once there are Sources to narrow, with
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
    filters: { gap: space.sm, paddingTop: space.md },
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
    sheet: { gap: 18 },
    field: { gap: 6 },
    fieldLabel: { ...typeScale.fieldLabel, color: c.muted },
  });
