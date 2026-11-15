import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Segment } from '@homelibra/ui/segment';
import { Sheet, SheetField } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { cx, useTheme } from '@homelibra/ui/theme';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useRouter } from 'expo-router';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import X from 'lucide-react-native/icons/x';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';

import {
  emptyYearRange,
  hasYear,
  type YearRangeDraft,
  YearRangeFields,
  yearRangeLabel,
  yearRangeOf,
} from '@/features/search/date-filter';
import { ShortWords } from '@/features/search/note-search';
import { SourceCover } from '@/features/source/source-cover';
import { useOffline } from '@/lib/network';
import { useSettled } from '@/features/search/settled';
import { useTRPC } from '@/lib/trpc';

type Results = inferRouterOutputs<AppRouter>['search']['library'];
type NoteResult = Results['notes'][number];
type SourceResult = Results['sources'][number];

/** Sources shown before "Tüm kaynaklar". */
const FIRST_SOURCES = 3;

/** A message, or the spinner, in the middle of the screen. */
const center = 'flex-1 items-center justify-center gap-md bg-page p-xl';

/** A row under another: a hairline over it. */
const divider = 'border-t border-line-soft';

/** The quote bar at an Excerpt's left. */
const excerptBar = 'border-l-2 border-quote-bar pl-2.75';

/** Tümü / Notlar / Kaynaklar. */
type Kind = 'all' | 'notes' | 'sources';

/** What Filtrele sets: which results show, and the Tarih filter. Tümü and no year keep everything. */
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
 * Filtrele icon opens Filtrele (#132): Tümü / Notlar / Kaynaklar and the Tarih filter,
 * which keeps the Sources, and the Notes whose Source, dated in its years
 * (#40, story 154), applied by "N sonucu göster". While a filter is on the
 * icon has a dot and a chip under the box names it, × taking it off. The
 * info icon beside the title, set by the tab's layout, opens Arama ipuçları.
 * Words too short for a prefix match are named in a line over the results,
 * or under "Sonuç yok." (#144).
 */
export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
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
    <View className="flex-1 bg-page">
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
        <View className="gap-sm px-gutter pt-0.5">
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
          {hidden && <Text variant="caption">{hidden}</Text>}
        </View>
      )}
      {offline ? (
        <View className={center}>
          <Text variant="body" className="text-center">
            {t('outbox.searchNeedsConnection')}
          </Text>
        </View>
      ) : query === '' ? (
        <View className="flex-1 bg-page" />
      ) : results.isPending ? (
        <View className={center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : results.isError ? (
        <View className={center}>
          <Text variant="body" className="text-center">
            {t('search.failed')}
          </Text>
          <Button variant="text" label={t('search.retry')} onPress={() => void results.refetch()} />
        </View>
      ) : sources.length === 0 && notes.length === 0 ? (
        <View className={center}>
          <Text variant="body" className="text-center">
            {t('search.empty')}
          </Text>
          <ShortWords words={first?.shortWords} centered />
        </View>
      ) : (
        <FlatList
          className="flex-1 bg-page"
          contentContainerClassName="px-gutter pb-xxl"
          keyboardShouldPersistTaps="handled"
          data={notes}
          keyExtractor={(note) => note.id}
          ListHeaderComponent={
            <>
              {!!first?.shortWords.length && (
                <View className="pt-md">
                  <ShortWords words={first.shortWords} />
                </View>
              )}
              {sources.length > 0 && (
                <View className="pt-md pb-xs">
                  <GroupHeading label={t('search.sources')} count={sources.length} />
                  {(kind === 'sources' ? sources : sources.slice(0, FIRST_SOURCES)).map((source, i) => (
                    <SourceRow key={source.id} source={source} divided={i > 0} />
                  ))}
                  {kind === 'all' && sources.length > FIRST_SOURCES && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setChoices({ ...choices, kind: 'sources' })}
                      className="self-start py-sm active:opacity-70"
                    >
                      <Text variant="button">{t('search.allSources', { count: sources.length })}</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {notes.length > 0 && (
                <View className={cx('pt-md pb-xs', sources.length > 0 && divider)}>
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
            results.isFetchingNextPage ? <ActivityIndicator color={colors.accent} className="py-md" /> : undefined
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
 * Filtrele: Sonuçlar (Tümü | Notlar | Kaynaklar) and Tarih (one calendar, two
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
  // The last choices stay on screen while the sheet slides away.
  const [lastDraft, setLastDraft] = useState(draft ?? initial);
  if (draft && draft !== lastDraft) setLastDraft(draft);
  // A year its calendar does not have (1400 r.) cannot be applied.
  const yearMissing = hasYear(lastDraft.dates) && yearRangeOf(lastDraft.dates) === null;
  const [counted, uncounted] = showLabels[lastDraft.kind];

  return (
    <Sheet
      visible={draft !== null}
      title={t('search.filter')}
      closeLabel={t('search.close')}
      onClose={onClose}
      secondary={{
        label: t('search.clearFilters'),
        onPress: () => onChange(unfiltered(lastDraft)),
        disabled: lastDraft.kind === 'all' && !hasYear(lastDraft.dates),
      }}
      primary={{
        label: count === null ? t(uncounted) : t(counted, { count }),
        onPress: onApply,
        disabled: yearMissing,
      }}
    >
      <View className="gap-4.5">
        <SheetField label={t('noteSearch.kindLabel')}>
          <Segment
            label={t('noteSearch.kindLabel')}
            options={[
              { value: 'all', label: t('noteSearch.all') },
              { value: 'notes', label: t('noteSearch.notes') },
              { value: 'sources', label: t('noteSearch.sources') },
            ]}
            value={lastDraft.kind}
            onChange={(kind) => onChange({ ...lastDraft, kind })}
            block
          />
        </SheetField>
        <SheetField label={t('search.dates')}>
          <YearRangeFields value={lastDraft.dates} onChange={(dates) => onChange({ ...lastDraft, dates })} />
        </SheetField>
      </View>
    </Sheet>
  );
}

/** Android adds its own padding above and below the line otherwise: no class sets these. */
const androidLine = { includeFontPadding: false, textAlignVertical: 'center' } as const;

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
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View className="items-center px-gutter pt-md pb-2.5">
      {/* 640 is the widest the search box gets on a wide screen. */}
      <View className={cx('w-full max-w-[640px] justify-center', offline && 'opacity-60')}>
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
          // As in TextField, the ring is always there and only coloured on focus: an outline added
          // on focus drops an Android input's padding and the placeholder runs under the glass.
          // Focused: an accent border and a 3px accent-soft ring, as every field has.
          className={cx(
            'type-body min-h-11.5 rounded-control border bg-surface px-10 py-3 text-fg outline-3 outline-solid',
            focused ? 'border-accent outline-accent-soft' : 'border-line outline-transparent',
          )}
          style={androidLine}
        />
        <View aria-hidden pointerEvents="none" className="absolute left-3.25">
          <Search color={offline ? colors.muted2 : colors.muted} size={18} strokeWidth={1.8} />
        </View>
        {value !== '' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.clear')}
            onPress={() => onChange('')}
            className="absolute right-px h-11 w-11 items-center justify-center active:opacity-70"
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
  const router = useRouter();
  // Yazar · Tarih, the Date as it was entered.
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
      className={cx('flex-row items-center gap-3.25 py-md active:opacity-70', divided && divider)}
    >
      <SourceCover type={source.type} cover={source.cover} />
      <View className="flex-1 gap-0.5">
        <Text variant="micro">{t(`sourceTypes.${source.type}.label`)}</Text>
        <Text variant="sourceTitleSm" numberOfLines={2}>
          {source.title}
        </Text>
        {byline !== '' && (
          <Text variant="caption" numberOfLines={1}>
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
  const router = useRouter();
  const meta = [
    [note.author, note.title].filter(Boolean).join(', '),
    note.locator,
    note.fromComment && t('search.fromComment'),
  ]
    .filter(Boolean)
    .join(' · ');
  const variant = note.fromComment ? 'comment' : 'excerpt';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: note.sourceId, note: note.id } })}
      className={cx('gap-1.5 py-md active:opacity-70', divided && divider)}
    >
      <Text variant={variant} className={note.fromComment ? undefined : excerptBar}>
        {note.fromComment && '↳ '}
        {note.snippet.map((segment, i) =>
          segment.hit ? (
            <Text key={i} variant={variant} color="fg" className="bg-mark">
              {segment.text}
            </Text>
          ) : (
            segment.text
          ),
        )}
      </Text>
      <Text variant="caption">{meta}</Text>
    </Pressable>
  );
}
