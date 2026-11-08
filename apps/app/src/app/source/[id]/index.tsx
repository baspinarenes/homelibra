import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { lastCaptured } from '@homelibra/core/note';
import { type ListedNote, type NoteStatus, withPendingNotes } from '@homelibra/outbox';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { type Colors, space, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight, usePreventRemove } from 'expo-router/react-navigation';
import PenLine from 'lucide-react-native/icons/pen-line';
import Search from 'lucide-react-native/icons/search';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { CoverEditor } from '@/components/cover-editor';
import { NoteComposer } from '@/components/note-composer';
import {
  type Match,
  MarkedText,
  SearchField,
  ShortWords,
  useSearchText,
  useSourceSearch,
} from '@/components/note-search';
import { OutboxStatus } from '@/components/outbox-status';
import { ReadingStatusButton } from '@/components/reading-status';
import { SourceSearchBar, SourceSearchNotice } from '@/components/source-search';
import { SourceTags } from '@/components/source-tags';
import { NoteTagsLine } from '@/components/tag-chips';
import { useSourceSearchPlace } from '@/lib/appearance-choices';
import { knownNotes } from '@/lib/known-notes';
import { useOutbox } from '@/lib/outbox';
import { useTRPC } from '@/lib/trpc';

type Source = inferRouterOutputs<AppRouter>['sources']['get'];

// Tries at placing a Note whose row is not laid out yet, and the wait between them in ms.
const scrollRetries = 5;
const scrollRetryAfter = 50;

// How long a Note is sent before its row says "gönderiliyor", in ms: a quick send says nothing.
const slowSendAfter = 1000;

/** A Note the list keeps in view: just above the bar once saved, or mid-screen when a search opened it. */
type Pin = { id: string; at: 'bar' | 'middle' };

/**
 * The Source page (#35, #87): the Source's heading and its Notes in Locator
 * order, with "Not al" at its foot. Capture happens here, in the writing
 * sheet over the page (#157); it has no screen of its own. Genel Bakış's
 * Kaldığın yer opens the page with the sheet up (`write`), a search result
 * on the Note it found (`note`), every other way in as for reading: the list
 * at the top. "Bu kaynakta ara" narrows the list to the Notes that match and
 * hides "Not al". It opens from the magnifier in the top bar, which becomes
 * the field while the heading folds to one line, or, as Görünüm can set, from
 * "Ara" on the Notes' heading. Going back puts the search away before it
 * leaves the page.
 */
export default function SourceScreen() {
  const { id, write, note } = useLocalSearchParams<{ id: string; write?: string; note?: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const source = useQuery(trpc.sources.get.queryOptions({ id }));
  const notes = useQuery(trpc.notes.list.queryOptions({ sourceId: id }));
  const { state } = useOutbox();
  // The Notes still in the outbox go on top of what the server (or, offline,
  // the phone's cache) last said; one waiting to move here comes from the
  // list it is in now.
  const shown = useMemo(() => {
    if (!notes.data) return undefined;
    const movingHere = state.pending.some((operation) => operation.type === 'moveNote' && operation.sourceId === id);
    return withPendingNotes(id, notes.data, state.pending, movingHere ? knownNotes() : []);
  }, [id, notes.data, state.pending]);

  // What the page last showed stays up while a refetch fails or waits for the network.
  if (!source.data || !shown) {
    const waitingForNetwork = source.fetchStatus === 'paused' || notes.fetchStatus === 'paused';
    return (
      <View style={styles.center}>
        {source.isError || notes.isError ? (
          <Text variant="body" style={styles.lead}>
            {t('sourcePage.loadFailed')}
          </Text>
        ) : waitingForNetwork ? (
          <Text variant="body" style={styles.lead}>
            {t('outbox.needsConnection')}
          </Text>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  }

  return <SourcePage source={source.data} notes={shown} statuses={state.status} write={write === '1'} found={note} />;
}

function SourcePage({
  source,
  notes,
  statuses,
  write,
  found,
}: {
  source: Source;
  notes: ListedNote[];
  statuses: ReadonlyMap<string, NoteStatus>;
  write: boolean;
  found: string | undefined;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const [searching, setSearching] = useState(false);
  const search = useSearchText();
  const searched = useSourceSearch(source.id, searching ? search.query : '');
  const listed = useMemo(
    () => (searched.matches ? notes.filter((note) => searched.matches?.has(note.id)) : notes),
    [notes, searched.matches],
  );
  const searchPlace = useSourceSearchPlace();
  const searchInBar = searching && searchPlace === 'header';
  const searchInNotes = searching && searchPlace === 'notes';
  const searchCount =
    searched.matches && !searched.failed
      ? t('noteSearch.matchCount', { shown: searched.matches.size, count: notes.length })
      : undefined;
  const closeSearch = () => {
    setSearching(false);
    search.setText('');
  };
  usePreventRemove(searching, closeSearch);
  const last = useMemo(() => lastCaptured(notes), [notes]);
  const list = useRef<FlatList<ListedNote>>(null);
  const pin = useRef<Pin | null>(
    write && last ? { id: last.id, at: 'bar' } : found ? { id: found, at: 'middle' } : null,
  );
  const retries = useRef(0);
  const openSearch = () => {
    pin.current = null;
    setSearching(true);
  };

  // The search can open anywhere down the list; what it finds starts at the top.
  useEffect(() => {
    if (searched.matches) list.current?.scrollToOffset({ offset: 0, animated: false });
  }, [searched.matches]);

  // Again whenever the list's height or content changes: the keyboard opens or closes, a saved Note comes in.
  const scrollToPin = () => {
    const target = pin.current;
    const index = target ? listed.findIndex((n) => n.id === target.id) : -1;
    if (!target || index < 0) return;
    list.current?.scrollToIndex({ index, animated: false, viewPosition: target.at === 'bar' ? 1 : 0.5 });
  };
  const pinAboveBar = (id: string) => {
    pin.current = { id, at: 'bar' };
    retries.current = 0;
    scrollToPin();
  };

  // Yazar · Tarih · Ek bilgi · not sayısı, the Date as it was entered.
  const byline = [
    source.author,
    source.date && formatDate(source.date),
    source.bibliographicNote,
    t('sourcePage.noteCount', { count: notes.length }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={headerHeight}
    >
      <Stack.Screen
        options={{
          title: '',
          headerTitle: () =>
            searchInBar ? (
              <SearchField
                look="bar"
                value={search.text}
                onChange={search.setText}
                placeholder={t('noteSearch.inSource')}
                autoFocus
              />
            ) : (
              <OutboxStatus />
            ),
          headerRight: searchInBar
            ? undefined
            : () => (
                <>
                  {searchPlace === 'header' && (
                    <HeaderIconAction icon={Search} label={t('noteSearch.inSource')} onPress={openSearch} />
                  )}
                  <HeaderIconAction
                    icon={PenLine}
                    label={t('sourcePage.edit')}
                    onPress={() => router.push({ pathname: '/source/[id]/edit', params: { id: source.id } })}
                  />
                </>
              ),
        }}
      />
      <FlatList
        ref={list}
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={listed}
        extraData={[statuses, searched.matches]}
        keyExtractor={(note) => note.id}
        keyboardShouldPersistTaps="handled"
        onLayout={scrollToPin}
        onContentSizeChange={scrollToPin}
        // Rows not laid out yet: jump near the Note, then try again once they are.
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          list.current?.scrollToOffset({ offset: averageItemLength * index, animated: false });
          if (retries.current++ < scrollRetries) setTimeout(scrollToPin, scrollRetryAfter);
        }}
        // The scholar scrolls away: the list stops holding the Note in view.
        onScrollBeginDrag={() => {
          pin.current = null;
        }}
        ListHeaderComponent={
          <>
            {searchInBar && (
              <View style={styles.fold}>
                <Text variant="sourceTitleSm" numberOfLines={1} style={styles.foldText}>
                  {source.title}
                </Text>
                {Boolean(source.author) && (
                  <Text variant="caption" numberOfLines={1} style={styles.foldText}>
                    {source.author}
                  </Text>
                )}
              </View>
            )}
            {/* Hidden rather than gone while folded, so the cover is not loaded again. */}
            <View style={[styles.heading, searchInBar && styles.hidden]}>
              <View style={styles.identity}>
                <CoverEditor sourceId={source.id} type={source.type} cover={source.cover} />
                <View style={styles.identityText}>
                  <View style={styles.typeLine}>
                    <Text variant="micro" color="accent">
                      {t(`sourceTypes.${source.type}.label`)}
                    </Text>
                    <ReadingStatusButton sourceId={source.id} status={source.readingStatus} />
                  </View>
                  <Text variant="sourceTitle">{source.title}</Text>
                  <Text variant="caption">{byline}</Text>
                </View>
              </View>
              <SourceTags sourceId={source.id} names={source.tags.map((tag) => tag.name)} />
            </View>
            <View style={[styles.notesHeading, searchInNotes && styles.notesSearching]}>
              {searchInNotes ? (
                <SourceSearchBar
                  text={search.text}
                  onChange={search.setText}
                  matches={searched.matches}
                  shortWords={searched.shortWords}
                  failed={searched.failed}
                  count={searchCount}
                  onClose={closeSearch}
                />
              ) : (
                <SectionHeading
                  title={t('sourcePage.notes')}
                  count={searchInBar ? searchCount : undefined}
                  action={
                    searchPlace === 'notes'
                      ? {
                          label: t('noteSearch.search'),
                          accessibilityLabel: t('noteSearch.inSource'),
                          icon: Search,
                          onPress: openSearch,
                        }
                      : undefined
                  }
                />
              )}
              {searchInBar && (
                <SourceSearchNotice
                  matches={searched.matches}
                  shortWords={searched.shortWords}
                  failed={searched.failed}
                />
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text variant="body" style={styles.empty}>
              {t(searched.matches ? 'noteSearch.sourceEmpty' : 'sourcePage.empty')}
            </Text>
            {searched.matches && <ShortWords words={searched.shortWords} centered />}
          </View>
        }
        renderItem={({ item: note, index }) => (
          <NoteRow
            note={note}
            divided={index > 0}
            match={searched.matches?.get(note.id)}
            status={statuses.get(note.id)}
            onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
            // A Note just come in is placed by estimate until its row is measured: place it again then.
            onLayout={() => {
              if (pin.current?.id === note.id) setTimeout(scrollToPin, 0);
            }}
          />
        )}
      />
      <NoteComposer
        sourceId={source.id}
        sourceType={source.type}
        carriedLocator={last?.locator ?? ''}
        openAtStart={write}
        hidden={searching}
        onSaved={pinAboveBar}
      />
    </KeyboardAvoidingView>
  );
}

/**
 * The status a Note's row says, from where the phone's outbox has it:
 * nothing once sent, nor while a send takes under {@link slowSendAfter}.
 */
function useShownStatus(status: NoteStatus | undefined) {
  const sending = status === 'sending';
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!sending) return;
    const timer = setTimeout(() => setSlow(true), slowSendAfter);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [sending]);
  return status === 'synced' || (sending && !slow) ? undefined : status;
}

/**
 * Locator on the left (— when it has none), Excerpt and ↳ Comment on the
 * right; under them, on the phone, while the outbox still has the Note:
 * kuyrukta / gönderiliyor / gönderilemedi / Kaynağı silinmiş. A Note still
 * waiting opens for editing too, through the outbox (#58).
 */
function NoteRow({
  note,
  divided,
  match,
  status,
  onPress,
  onLayout,
}: {
  note: ListedNote;
  divided: boolean;
  /** What "Bu kaynakta ara" found in it, to mark. */
  match: Match | undefined;
  status: NoteStatus | undefined;
  onPress: () => void;
  onLayout: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const shown = useShownStatus(status);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('sourcePage.editNote')}
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [styles.row, divided && styles.divided, pressed && styles.pressed]}
    >
      <View style={styles.locatorColumn}>
        <Text variant="locator">{note.locator ?? '—'}</Text>
      </View>
      <View style={styles.texts}>
        {note.excerpt && (
          <MarkedText text={note.excerpt} marks={match?.excerpt} variant="excerpt" style={styles.excerpt} />
        )}
        {note.comment && <MarkedText text={note.comment} marks={match?.comment} variant="comment" prefix="↳ " />}
        <NoteTagsLine names={note.tags.map((tag) => tag.name)} />
        {shown && (
          <Text variant="caption" color="warn">
            {t(`outbox.${shown}`)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.gutter, paddingBottom: space.lg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { textAlign: 'center' },
    pressed: { opacity: 0.7 },
    heading: {
      gap: 10,
      paddingTop: space.md,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    // As a Section spaces its heading: 18 under the rule, the first row's own 12 below.
    notesHeading: { paddingTop: 18, gap: space.sm },
    // The field's own height stands in for the heading's line.
    notesSearching: { paddingTop: 10 },
    fold: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      paddingVertical: space.md,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    foldText: { flexShrink: 1 },
    identity: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    identityText: { flex: 1, gap: space.xs },
    typeLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    hidden: { display: 'none' },
    emptyBox: { gap: space.sm, paddingVertical: space.xl },
    empty: { textAlign: 'center' },
    row: { flexDirection: 'row', gap: 10, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    locatorColumn: { width: 68, gap: space.xs, paddingTop: 4 },
    texts: { flex: 1, gap: 6 },
    excerpt: {
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
  });
