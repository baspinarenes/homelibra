import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Segment } from '@homelibra/ui/segment';
import { Sheet } from '@homelibra/ui/sheet';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useRouter } from 'expo-router';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import X from 'lucide-react-native/icons/x';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  emptyYearRange,
  hasYear,
  type YearRangeDraft,
  YearRangeFields,
  yearRangeLabel,
  yearRangeOf,
} from '@/components/date-filter';
import { SourceCover } from '@/components/source-cover';
import { useOffline } from '@/lib/network';
import { useSettled } from '@/lib/settled';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type Results = inferRouterOutputs<AppRouter>['search']['library'];
type NoteResult = Results['notes'][number];
type SourceResult = Results['sources'][number];

/** The widest the search box gets on a wide screen. */
const BOX_WIDTH = 640;

/** Sources shown before "Tüm kaynaklar". */
const FIRST_SOURCES = 3;

/** Tümü / Notlar / Kaynaklar. */
type Kind = 'all' | 'notes' | 'sources';

/** What Süz sets: which results show, and the Tarih filter. Tümü and no year keep everything. */
type Choices = { kind: Kind; dates: YearRangeDraft };

const initial: Choices = { kind: 'all', dates: emptyYearRange };

/** Every filter off, the calendar kept. */
const unfiltered = (choices: Choices): Choices => ({
  kind: 'all',
  dates: { ...emptyYearRange, calendar: choices.dates.calendar },
});

/** How many results a kind shows, by a search's first page. */
function countOf(kind: Kind, first: Results) {
  if (kind === 'notes') return first.noteTotal;
  if (kind === 'sources') return first.sources.length;
  return first.sources.length + first.noteTotal;
}

/** The "Tarihsiz kaynaklardan … gizli" line for what the kind shows, or null when nothing is hidden. */
function hiddenLine(
  t: ReturnType<typeof useTranslation>['t'],
  kind: Kind,
  hidden: Results['hiddenUndated'] | undefined,
) {
  if (!hidden) return null;
  if (kind === 'notes') return hidden.notes > 0 ? t('search.hiddenNotes', { count: hidden.notes }) : null;
  if (kind === 'sources') return hidden.sources > 0 ? t('dateFilter.hiddenSources', { count: hidden.sources }) : null;
  return hidden.sources > 0 || hidden.notes > 0 ? t('dateFilter.hiddenResults', hidden) : null;
}

/**
 * Ara: the whole Library searched by the words of its Notes and Sources
 * (ADR-0005). The box under the title sends the query as typed; the server
 * folds, stems, ranks and marks the matching words (ADR-0010). The header's
 * Süz icon opens Süz (#132): Tümü / Notlar / Kaynaklar and the Tarih filter,
 * which keeps the Sources, and the Notes whose Source, dated in its years
 * (#40, story 154), applied by "N sonucu göster". While a filter is on the
 * icon has a dot and a chip under the box names it, × taking it off. The
 * info icon beside the title, set by the tab's layout, opens Arama ipuçları.
 */
export default function SearchScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const [text, setText] = useState('');
  const query = useSettled(text.trim());
  const offline = useOffline();
  const [choices, setChoices] = useState(initial);
  // The sheet's choices while it is open; "Kapat" drops them.
  const [draft, setDraft] = useState<Choices | null>(null);
  const { kind } = choices;
  const dates = yearRangeOf(choices.dates);
  const filterOn = kind !== 'all' || dates !== null;
  const search = (range: typeof dates) =>
    trpc.search.library.infiniteQueryOptions({ query, dates: range }, { getNextPageParam: (page) => page.nextCursor });
  const results = useInfiniteQuery({
    ...search(dates),
    enabled: query !== '',
    // Keep the last results on screen while the next query runs.
    placeholderData: keepPreviousData,
  });
  // The sheet's count: the same search with the years in the sheet, once typing settles.
  const draftDates = yearRangeOf(useSettled(draft?.dates ?? choices.dates));
  const counted = useInfiniteQuery({
    ...search(draftDates),
    enabled: draft !== null && query !== '',
    placeholderData: keepPreviousData,
  });
  const counts = counted.data?.pages[0];
  const first = results.data?.pages[0];
  const sources = kind === 'notes' ? [] : (first?.sources ?? []);
  const notes = kind === 'sources' ? [] : (results.data?.pages.flatMap((page) => page.notes) ?? []);
  const hidden = hiddenLine(t, kind, query !== '' && dates ? first?.hiddenUndated : undefined);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          // Offline there is nothing to narrow.
          headerRight: offline
            ? undefined
            : () => (
                <HeaderIconAction
                  icon={SlidersHorizontal}
                  label={t(filterOn ? 'search.filterActive' : 'search.filter')}
                  dot={filterOn}
                  size={24}
                  onPress={() => setDraft(choices)}
                />
              ),
        }}
      />
      <SearchBox value={text} onChange={setText} offline={offline} />
      {!offline && filterOn && (
        <View style={styles.filters}>
          <ChipRow>
            {kind !== 'all' && (
              <Chip
                label={t(kind === 'notes' ? 'noteSearch.notes' : 'noteSearch.sources')}
                selected
                removable
                onPress={() => setChoices({ ...choices, kind: 'all' })}
              />
            )}
            {dates && (
              <Chip
                label={yearRangeLabel(dates, t('dateFilter.open'))}
                selected
                removable
                onPress={() => setChoices({ ...choices, dates: unfiltered(choices).dates })}
              />
            )}
          </ChipRow>
          {hidden && <Text style={styles.hidden}>{hidden}</Text>}
        </View>
      )}
      {offline ? (
        <View style={styles.center}>
          <Text style={styles.lead}>{t('outbox.searchNeedsConnection')}</Text>
        </View>
      ) : query === '' ? (
        <View style={styles.screen} />
      ) : results.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={styles.spinner.color} />
        </View>
      ) : results.isError ? (
        <View style={styles.center}>
          <Text style={styles.lead}>{t('search.failed')}</Text>
          <Button variant="text" label={t('search.retry')} onPress={() => void results.refetch()} />
        </View>
      ) : sources.length === 0 && notes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.lead}>{t('search.empty')}</Text>
        </View>
      ) : (
        <FlatList
          style={styles.screen}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          data={notes}
          keyExtractor={(note) => note.id}
          ListHeaderComponent={
            <>
              {sources.length > 0 && (
                <View style={styles.group}>
                  <GroupHeading label={t('search.sources')} count={sources.length} />
                  {(kind === 'sources' ? sources : sources.slice(0, FIRST_SOURCES)).map((source, i) => (
                    <SourceRow key={source.id} source={source} divided={i > 0} />
                  ))}
                  {kind === 'all' && sources.length > FIRST_SOURCES && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setChoices({ ...choices, kind: 'sources' })}
                      style={({ pressed }) => [styles.allSources, pressed && styles.pressed]}
                    >
                      <Text style={styles.allSourcesText}>{t('search.allSources', { count: sources.length })}</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {notes.length > 0 && (
                <View style={[styles.group, sources.length > 0 && styles.divided]}>
                  <GroupHeading label={t('search.notes')} count={first?.noteTotal ?? 0} />
                </View>
              )}
            </>
          }
          renderItem={({ item: note, index }) => <NoteRow note={note} divided={index > 0} />}
          onEndReached={() => {
            if (kind !== 'sources' && results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            results.isFetchingNextPage ? (
              <ActivityIndicator color={styles.spinner.color} style={styles.more} />
            ) : undefined
          }
        />
      )}
      <FilterSheet
        draft={draft}
        onChange={setDraft}
        count={draft && query !== '' && counts ? countOf(draft.kind, counts) : null}
        onApply={() => {
          if (draft) setChoices(draft);
          setDraft(null);
        }}
        onClose={() => setDraft(null)}
      />
    </View>
  );
}

/** The sheet's main action per kind, with N and before a word is typed. */
const showLabels = {
  all: ['search.showAll', 'search.showAllUncounted'],
  notes: ['search.showNotes', 'search.showNotesUncounted'],
  sources: ['search.showSources', 'search.showSourcesUncounted'],
} as const;

/**
 * Süz: Sonuçlar (Tümü | Notlar | Kaynaklar) and Tarih (one calendar, two
 * years); Temizle and "N sonucu göster" ("N notu", "N kaynağı" for one
 * kind), N following the choices.
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
  /** Null before a word is typed, when there is nothing to count. */
  count: number | null;
  onApply: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  // The last choices stay on screen while the sheet slides away.
  const [shown, setShown] = useState(draft ?? initial);
  if (draft && draft !== shown) setShown(draft);
  // A year its calendar does not have (1400 r.) cannot be applied.
  const yearMissing = hasYear(shown.dates) && yearRangeOf(shown.dates) === null;
  const [counted, uncounted] = showLabels[shown.kind];

  return (
    <Sheet
      visible={draft !== null}
      title={t('search.filter')}
      closeLabel={t('search.close')}
      onClose={onClose}
      secondary={{
        label: t('search.clearFilters'),
        onPress: () => onChange(unfiltered(shown)),
        disabled: shown.kind === 'all' && !hasYear(shown.dates),
      }}
      primary={{
        label: count === null ? t(uncounted) : t(counted, { count }),
        onPress: onApply,
        disabled: yearMissing,
      }}
    >
      <View style={styles.sheet}>
        <Field label={t('noteSearch.kindLabel')}>
          <Segment
            label={t('noteSearch.kindLabel')}
            options={[
              { value: 'all', label: t('noteSearch.all') },
              { value: 'notes', label: t('noteSearch.notes') },
              { value: 'sources', label: t('noteSearch.sources') },
            ]}
            value={shown.kind}
            onChange={(kind) => onChange({ ...shown, kind })}
            block
          />
        </Field>
        <Field label={t('search.dates')}>
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
 * The box under the title, a magnifier at its left and × at its right once
 * something is typed. Offline it says a search needs the connection, so no
 * result is taken for "not yok".
 */
function SearchBox({
  value,
  onChange,
  offline,
}: {
  value: string;
  onChange: (text: string) => void;
  offline: boolean;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.boxRow}>
      <View style={[styles.box, offline && styles.boxOff]}>
        <TextInput
          accessibilityLabel={t('tabs.search')}
          placeholder={t(offline ? 'outbox.searchNeedsConnection' : 'search.placeholder')}
          editable={!offline}
          placeholderTextColor={colors.muted2}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, focused && styles.focused]}
        />
        <View aria-hidden pointerEvents="none" style={styles.glass}>
          <Search color={offline ? colors.muted2 : colors.muted} size={18} strokeWidth={1.8} />
        </View>
        {value !== '' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.clear')}
            onPress={() => onChange('')}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <X color={colors.muted} size={18} strokeWidth={1.8} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function GroupHeading({ label, count }: { label: string; count: number }) {
  return <SectionHeading title={`${label} · ${count}`} />;
}

function SourceRow({ source, divided }: { source: SourceResult; divided: boolean }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  // Yazar · Tarih, the Date as it was entered.
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
      style={({ pressed }) => [styles.sourceRow, divided && styles.divided, pressed && styles.pressed]}
    >
      <SourceCover type={source.type} cover={source.cover} />
      <View style={styles.sourceText}>
        <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
        <Text style={styles.sourceTitle} numberOfLines={2}>
          {source.title}
        </Text>
        {byline !== '' && (
          <Text style={styles.meta} numberOfLines={1}>
            {byline}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** The matching part, marked; then Yazar, Başlık · Konum, and "yorumdan" when the part is from the Comment. */
function NoteRow({ note, divided }: { note: NoteResult; divided: boolean }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const meta = [
    [note.author, note.title].filter(Boolean).join(', '),
    note.locator,
    note.fromComment && t('search.fromComment'),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: note.sourceId, note: note.id } })}
      style={({ pressed }) => [styles.noteRow, divided && styles.divided, pressed && styles.pressed]}
    >
      <Text style={note.fromComment ? styles.comment : styles.excerpt}>
        {note.fromComment && '↳ '}
        {note.snippet.map((segment, i) =>
          segment.hit ? (
            <Text key={i} style={styles.hit}>
              {segment.text}
            </Text>
          ) : (
            segment.text
          ),
        )}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.gutter, paddingBottom: space.xxl },
    group: { paddingTop: space.md, paddingBottom: space.xs },
    filters: { gap: space.sm, paddingHorizontal: space.gutter, paddingTop: 2 },
    hidden: { ...typeScale.caption, color: c.muted },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.md,
      padding: space.xl,
      backgroundColor: c.page,
    },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    boxRow: { paddingTop: 2, paddingBottom: 10, paddingHorizontal: space.gutter, alignItems: 'center' },
    box: { width: '100%', maxWidth: BOX_WIDTH, justifyContent: 'center' },
    boxOff: { opacity: 0.6 },
    glass: { position: 'absolute', left: 13 },
    input: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      minHeight: 46,
      paddingVertical: 12,
      paddingLeft: 40,
      paddingRight: 40,
      // Android adds its own padding above and below the line otherwise.
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    // An accent border and a 3px accent-soft ring, as every field has.
    focused: { borderColor: c.accent, outlineColor: c.accentSoft, outlineWidth: 3, outlineStyle: 'solid' },
    clear: { position: 'absolute', right: 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    sheet: { gap: 18 },
    field: { gap: 6 },
    fieldLabel: { ...typeScale.fieldLabel, color: c.muted },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: space.md },
    sourceText: { flex: 1, gap: 2 },
    type: { ...typeScale.micro, color: c.muted },
    sourceTitle: { ...typeScale.sourceTitleSm, color: c.fg },
    allSources: { alignSelf: 'flex-start', paddingVertical: space.sm },
    allSourcesText: { ...typeScale.button, color: c.accent },
    noteRow: { gap: 6, paddingVertical: space.md },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
    hit: { backgroundColor: c.mark, color: c.fg },
    meta: { ...typeScale.caption, color: c.muted },
    more: { paddingVertical: space.md },
  });
