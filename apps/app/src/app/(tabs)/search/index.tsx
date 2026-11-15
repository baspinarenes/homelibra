import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { NoteRow as WideNoteRow } from '@homelibra/ui/note-row';
import { KeyHints, PanelLayout } from '@homelibra/ui/panel';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Segment } from '@homelibra/ui/segment';
import { Sheet, SheetField } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { cx, useTheme } from '@homelibra/ui/theme';
import { type Density, useShortcuts } from '@homelibra/ui/wide-layout';
import { keepPreviousData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import Search from 'lucide-react-native/icons/search';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import X from 'lucide-react-native/icons/x';
import { type ReactElement, type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  type PressableInstance,
  TextInput,
  type TextInputInstance,
  View,
  type ViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  emptyYearRange,
  hasYear,
  type YearRangeDraft,
  YearRangeFields,
  yearRangeLabel,
  yearRangeOf,
} from '@/features/search/date-filter';
import { copyNoteMarkdown } from '@/features/collection/collection-actions';
import type { NoteFocus } from '@/features/collection/note-focus';
import { viewAction } from '@/features/collection/view-keys';
import { ShortWords } from '@/features/search/note-search';
import { SearchNotePanel } from '@/features/search/search-note-panel';
import { useNoteEditing } from '@/features/collection/collection-note-panel';
import { resultMeta, resultRow, stepInResults } from '@/features/search/search-results';
import { SearchTipsPopover } from '@/features/search/search-tips';
import { SourceCover } from '@/features/source/source-cover';
import type { CoverSize } from '@/features/source/template-cover';
import { useFramePanel } from '@/components/wide-frame';
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
 * or under "Sonuç yok." (#144). The quick search window's "Ara'da tüm
 * sonuçlar" opens Ara with its query in the box (`q`, #175).
 *
 * On a wide screen (#174) it has a Collection's layout (#171): no header,
 * the box at the list's top with Arama ipuçları behind its ?, under it
 * Tümü / Notlar / Kaynaklar with their counts and Tarih, the years opening
 * in the page; the same query and the same rules. A Note opens in the panel
 * beside the list, the rows going compact; a Source opens its page. ↑↓ move
 * the panel through the Notes found, ⌘C copies its Note, E edits it, /
 * goes to the box, Esc closes the Tarih fields, then the panel.
 */
export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const trpc = useTRPC();
  const router = useRouter();
  // `q`: a query handed over, by the quick search window's "Ara'da tüm sonuçlar" (#175).
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [text, setText] = useState(q ?? '');
  const [taken, setTaken] = useState(q);
  if (q !== taken) {
    setTaken(q);
    if (q !== undefined) setText(q);
  }
  // Once in the box the query is the box's: the same one handed over again replaces what was typed since.
  useEffect(() => {
    if (q !== undefined) router.setParams({ q: undefined });
  }, [q, router]);
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

  // The wide tier's panel (#174): the Note it shows and the query it was opened from; null while
  // it is closed, as on entry. A new query, Kaynaklar alone or no connection puts it away.
  // `byKeys`: ↑↓ chose it, so the focus goes to its row too.
  const [opened, setOpened] = useState<{ focus: NoteFocus; query: string; byKeys?: boolean } | null>(null);
  const focus = opened && opened.query === query && kind !== 'sources' && !offline ? opened.focus : null;
  // Put away for good: it does not come back with the query, Tümü or the connection.
  if (opened && !focus) setOpened(null);
  const layout = useFramePanel(focus !== null);
  const wide = layout.tier === 'wide';
  const panelOpen = wide && focus !== null;
  // While its Note is edited in the panel, the edit hears the keys.
  const { editing, setEditing } = useNoteEditing(focus);
  const openNote = (to: NoteFocus, byKeys = false) => setOpened({ focus: to, query, byKeys });
  const closePanel = () => setOpened(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const box = useRef<TextInputInstance>(null);
  const inFront = useIsFocused();
  const queryClient = useQueryClient();
  const { top } = useSafeAreaInsets();
  // What the panel fetched for its Note: a key acts on it at once, the clipboard allows no wait.
  const sourceNotes = (sourceId: string) => queryClient.getQueryData(trpc.notes.list.queryKey({ sourceId }));

  useShortcuts({ panelOpen, active: wide && inFront && !tipsOpen && !editing }, (command) => {
    // Esc puts the Tarih fields away before the panel.
    if ((command === 'closePanel' || command === 'back') && draft) {
      setDraft(null);
      return true;
    }
    const action = viewAction(command, { panelOpen, renaming: false, searching: false, notes: notes.length });
    switch (action) {
      case 'previous':
      case 'next': {
        const order = focus ? sourceNotes(focus.sourceId)?.map((note) => note.id) : undefined;
        const to = stepInResults(notes, focus, action, order);
        if (to) openNote(to, true);
        return to !== null;
      }
      case 'copyNote': {
        if (!focus) return false;
        const note = sourceNotes(focus.sourceId)?.find((n) => n.id === focus.noteId);
        const source = queryClient.getQueryData(trpc.sources.get.queryKey({ id: focus.sourceId }));
        if (!note || !source) return false;
        copyNoteMarkdown(source, note, {
          done: t('collectionActions.copied', { count: 1 }),
          failed: t('collectionActions.copyFailed'),
        });
        return true;
      }
      case 'edit':
        if (!focus) return false;
        setEditing(true);
        return true;
      case 'searchHere':
        box.current?.focus();
        return true;
      case 'closePanel':
        closePanel();
        return true;
      default:
        return false;
    }
  });

  // What stands in the list's place while there is no list to show.
  const message = offline ? (
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
  ) : null;

  /** Over the Notes: the short words, the Sources found (the first three under Tümü), the Notes' heading. */
  const listHeader = (cover: CoverSize) => (
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
            <SourceRow key={source.id} source={source} divided={i > 0} cover={cover} />
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
  );
  const nextPage = () => {
    if (kind !== 'sources' && results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
  };
  const listFooter = results.isFetchingNextPage ? (
    <ActivityIndicator color={colors.accent} className="py-md" />
  ) : undefined;

  if (wide) {
    // Tümü 7 · Notlar 3 · Kaynaklar 4, once a search has counted them.
    const kindLabel = (option: Kind, key: 'noteSearch.all' | 'noteSearch.notes' | 'noteSearch.sources') =>
      query !== '' && first ? `${t(key)} ${countOf(option, first)}` : t(key);
    // Along the list's foot while the panel is open, beside the full sidebar; only keys that act here.
    const keyHints = [
      { keys: '↑↓', label: t('widePanel.hintRows') },
      { keys: '⌘C', label: t('widePanel.hintCopyNote') },
      { keys: '/', label: t('widePanel.hintSearch') },
      { keys: 'Esc', label: t('widePanel.hintClose') },
    ];
    return (
      <View className="flex-1">
        <Stack.Screen options={{ headerShown: false }} />
        <PanelLayout
          narrow={layout.sidebar === 'iconRail'}
          panel={
            focus && (
              <SearchNotePanel
                focus={focus}
                editing={editing}
                onEditingChange={setEditing}
                onFocus={(to) => openNote(to)}
                onClose={closePanel}
              />
            )
          }
        >
          <View className="flex-1 bg-page">
            {/* The status bar's inset, which the tab's header kept, and 16 under it. */}
            <View className="gap-2.5 border-b border-line px-lg pb-md" style={{ paddingTop: top + 16 }}>
              <SearchBox
                value={text}
                onChange={setText}
                offline={offline}
                inputRef={box}
                tips={<SearchTipsPopover open={tipsOpen} onOpenChange={setTipsOpen} />}
              />
              {!offline && (
                <View className="flex-row flex-wrap items-center gap-sm">
                  <Segment
                    label={t('noteSearch.kindLabel')}
                    options={[
                      { value: 'all', label: kindLabel('all', 'noteSearch.all') },
                      { value: 'notes', label: kindLabel('notes', 'noteSearch.notes') },
                      { value: 'sources', label: kindLabel('sources', 'noteSearch.sources') },
                    ]}
                    value={kind}
                    onChange={(next) => setChoices({ ...choices, kind: next })}
                  />
                  <Button label={t('search.dates')} variant="small" onPress={() => setDraft(draft ? null : choices)} />
                  {dates && (
                    <Chip
                      label={yearRangeLabel(dates, t('dateFilter.open'))}
                      selected
                      removable
                      onPress={() => setChoices({ ...choices, dates: unfiltered(choices).dates })}
                    />
                  )}
                </View>
              )}
              {!offline && hidden && <Text variant="caption">{hidden}</Text>}
              {!offline && draft && (
                <DatesPanel
                  draft={draft}
                  onChange={setDraft}
                  kind={kind}
                  count={query !== '' && counts ? countOf(kind, counts) : null}
                  onApply={() => {
                    setChoices({ ...choices, dates: draft.dates });
                    setDraft(null);
                  }}
                />
              )}
            </View>
            {message ?? (
              <WideResults
                notes={notes}
                density={layout.density}
                focus={focus}
                onOpen={(to) => openNote(to)}
                focusRow={opened?.byKeys ?? false}
                header={<View className="px-lg">{listHeader('table')}</View>}
                footer={listFooter}
                onEndReached={nextPage}
              />
            )}
            {panelOpen && !editing && layout.sidebar === 'full' && <KeyHints hints={keyHints} />}
          </View>
        </PanelLayout>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-page">
      <Stack.Screen
        options={{
          headerShown: true,
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
      {message ?? (
        <FlatList
          className="flex-1 bg-page"
          contentContainerClassName="px-gutter pb-xxl"
          keyboardShouldPersistTaps="handled"
          data={notes}
          keyExtractor={(note) => note.id}
          ListHeaderComponent={listHeader('small')}
          renderItem={({ item: note, index }) => <NoteRow note={note} divided={index > 0} />}
          onEndReached={nextPage}
          onEndReachedThreshold={0.5}
          ListFooterComponent={listFooter}
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

/**
 * A wide Ara's Tarih (#174): the years in the page under the bar, beside
 * nothing and over nothing, as a wide Kaynaklar's Filtrele; Temizle and
 * "N sonucu göster" as in the phone's sheet, N for the kind chosen.
 */
function DatesPanel({
  draft,
  onChange,
  kind,
  count,
  onApply,
}: {
  draft: Choices;
  onChange: (draft: Choices) => void;
  kind: Kind;
  /** Null before a word is typed, when there is nothing to count. */
  count: number | null;
  onApply: () => void;
}) {
  const { t } = useTranslation();
  const [counted, uncounted] = showLabels[kind];
  return (
    <View className="max-w-[640px] gap-md pt-xs">
      <YearRangeFields value={draft.dates} onChange={(dates) => onChange({ ...draft, dates })} />
      <View className="flex-row gap-sm">
        <Button
          label={t('search.clearFilters')}
          variant="secondary"
          onPress={() => onChange({ ...draft, dates: unfiltered(draft).dates })}
          disabled={!hasYear(draft.dates)}
        />
        <Button
          label={count === null ? t(uncounted) : t(counted, { count })}
          onPress={onApply}
          // A year its calendar does not have (1400 r.) cannot be applied.
          disabled={hasYear(draft.dates) && yearRangeOf(draft.dates) === null}
        />
      </View>
    </View>
  );
}

/**
 * A wide Ara's Notes, @homelibra/ui's NoteRow as a Collection's (#171): full
 * rows, compact while the panel is open, the one it shows framed; a press
 * opens the Note in the panel. As in a Collection's view the pressed row
 * stays where it stood on the screen while the rows go compact, and a row
 * the keys move to is brought into view (that measuring is CollectionView's
 * own, written again here for a ranked list rather than one grouped by Source).
 */
function WideResults({
  notes,
  density,
  focus,
  onOpen,
  focusRow,
  header,
  footer,
  onEndReached,
}: {
  notes: NoteResult[];
  density: Density;
  focus: NoteFocus | null;
  onOpen: (focus: NoteFocus) => void;
  /** The keys chose `focus` (↑↓): the focus goes to its row too, so the framed row and the focused one agree. */
  focusRow: boolean;
  header: ReactElement;
  footer: ReactElement | undefined;
  onEndReached: () => void;
}) {
  const { t } = useTranslation();
  const list = useRef<FlatList<NoteResult>>(null);
  const frame = useRef<ViewInstance>(null);
  const rows = useRef(new Map<string, ViewInstance>());
  // Each drawn row's own press target, to put the focus on.
  const targets = useRef(new Map<string, PressableInstance>());
  const scrollY = useRef(0);
  // The pressed row and where it stood on the screen, until the rows have changed under it.
  const pressed = useRef<{ id: string; top: number } | null>(null);
  const focused = focus?.noteId ?? null;

  const scrollBy = (dy: number) => {
    if (Math.abs(dy) >= 1) list.current?.scrollToOffset({ offset: scrollY.current + dy, animated: false });
  };

  // The rows have changed density under the pressed row: put it back where it stood.
  useEffect(() => {
    const was = pressed.current;
    if (!was) return;
    const frameId = requestAnimationFrame(() => {
      pressed.current = null;
      rows.current.get(was.id)?.measureInWindow((_x, top) => scrollBy(top - was.top));
    });
    return () => cancelAnimationFrame(frameId);
    // Only a change of density moves the rows; scrollBy reads refs.
  }, [density]);

  // A row the keys moved to comes into view and takes the focus; a pressed one already has both.
  useEffect(() => {
    if (!focused || pressed.current) return;
    const row = rows.current.get(focused);
    if (focusRow) targets.current.get(focused)?.focus();
    if (!row) {
      // Not drawn yet, far down a long list: the list finds it and draws it.
      const index = notes.findIndex((note) => note.id === focused);
      if (index >= 0) list.current?.scrollToIndex({ index, viewPosition: 0.5, animated: false });
      if (!focusRow) return;
      const frameId = requestAnimationFrame(() => targets.current.get(focused)?.focus());
      return () => cancelAnimationFrame(frameId);
    }
    frame.current?.measureInWindow((_fx, frameTop, _fw, frameHeight) =>
      row.measureInWindow((_x, top, _w, height) => {
        if (top < frameTop) scrollBy(top - frameTop);
        else if (top + height > frameTop + frameHeight) scrollBy(top + height - frameTop - frameHeight);
      }),
    );
    // Only a change of the focused Note asks for this.
  }, [focused]);

  const open = (to: NoteFocus) => {
    const row = rows.current.get(to.noteId);
    // With the panel open already the rows keep their density, and nothing moves.
    if (!row || focus) return onOpen(to);
    row.measureInWindow((_x, top) => {
      pressed.current = { id: to.noteId, top };
      onOpen(to);
    });
  };

  return (
    <View ref={frame} collapsable={false} className="flex-1">
      <FlatList
        ref={list}
        className="flex-1 bg-page"
        contentContainerClassName="px-sm pb-xxl"
        keyboardShouldPersistTaps="handled"
        data={notes}
        keyExtractor={(note) => note.id}
        extraData={[density, focused]}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          scrollY.current = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        onScrollToIndexFailed={() => {}}
        ListHeaderComponent={header}
        renderItem={({ item: note, index }) => (
          <View
            ref={(row) => {
              if (row) rows.current.set(note.id, row);
              else rows.current.delete(note.id);
            }}
            collapsable={false}
          >
            <WideNoteRow
              ref={(target) => {
                if (target) targets.current.set(note.id, target);
                else targets.current.delete(note.id);
              }}
              density={density}
              locator={note.locator}
              {...resultRow(note)}
              meta={resultMeta(note, t('search.fromComment'))}
              selected={note.id === focused}
              divided={index > 0}
              hint={t('widePanel.openNote')}
              labels={{ withComment: t('widePanel.withComment') }}
              onPress={() => open({ sourceId: note.sourceId, noteId: note.id })}
            />
          </View>
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={footer}
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
 * result is taken for "not yok". With `tips` (a wide screen's ?) it fills the
 * list's top, the ? at its right after the ×, and `inputRef` lets / reach it.
 */
function SearchBox({
  value,
  onChange,
  offline,
  tips,
  inputRef,
}: {
  value: string;
  onChange: (text: string) => void;
  offline: boolean;
  tips?: ReactNode;
  inputRef?: RefObject<TextInputInstance | null>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const clear = (className: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('search.clear')}
      onPress={() => onChange('')}
      className={className}
    >
      <X color={colors.muted} size={18} strokeWidth={1.8} />
    </Pressable>
  );
  return (
    <View className={tips ? 'w-full' : 'items-center px-gutter pt-md pb-2.5'}>
      {/* 640 is the widest the search box gets on a wide screen. */}
      <View className={cx('w-full max-w-[640px] justify-center', offline && 'opacity-60')}>
        <TextInput
          ref={inputRef}
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
            'type-body min-h-11.5 rounded-control border bg-surface py-3 text-fg outline-3 outline-solid',
            tips ? 'pr-20 pl-10' : 'px-10',
            focused ? 'border-accent outline-accent-soft' : 'border-line outline-transparent',
          )}
          style={androidLine}
        />
        <View aria-hidden pointerEvents="none" className="absolute left-3.25">
          <Search color={offline ? colors.muted2 : colors.muted} size={18} strokeWidth={1.8} />
        </View>
        {tips ? (
          <View className="absolute right-px flex-row items-center">
            {value !== '' && clear('h-11 w-9 items-center justify-center active:opacity-70')}
            {tips}
          </View>
        ) : (
          value !== '' && clear('absolute right-px h-11 w-11 items-center justify-center active:opacity-70')
        )}
      </View>
    </View>
  );
}

function GroupHeading({ label, count }: { label: string; count: number }) {
  return <SectionHeading title={`${label} · ${count}`} />;
}

/** `cover`: the phone's small Cover, or the table's 24 × 34 in a wide list. */
function SourceRow({ source, divided, cover }: { source: SourceResult; divided: boolean; cover: CoverSize }) {
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
      <SourceCover type={source.type} cover={source.cover} size={cover} />
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
