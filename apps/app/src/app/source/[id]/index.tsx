import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { lastCaptured } from '@homelibra/core/note';
import { type ListedNote, type NoteStatus, withPendingNotes } from '@homelibra/outbox';
import { HeaderTextAction } from '@homelibra/ui/screen-header';
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CoverEditor } from '@/components/cover-editor';
import { AddCommentButton, NoteComposer, type NoteComposerHandle } from '@/components/note-composer';
import { type Match, MarkedText, useSearchText, useSourceSearch } from '@/components/note-search';
import { OutboxStatus } from '@/components/outbox-status';
import { ReadingStatusButton } from '@/components/reading-status';
import { SourceSearchBar, SourceSearchButton } from '@/components/source-search';
import { SourceTags } from '@/components/source-tags';
import { NoteTagsLine } from '@/components/tag-chips';
import { knownNotes } from '@/lib/known-notes';
import { useOutbox } from '@/lib/outbox';
import { useTRPC } from '@/lib/trpc';

type Source = inferRouterOutputs<AppRouter>['sources']['get'];

// Tries at placing a Note whose row is not laid out yet, and the wait between them in ms.
const scrollRetries = 5;
const scrollRetryAfter = 50;

// How long a Note is sent before its row says "gönderiliyor", in ms: a quick send says nothing.
const slowSendAfter = 1000;

/** A Note the list keeps in view: just above the box while writing, or mid-screen when a search opened it. */
type Pin = { id: string; at: 'box' | 'middle' };

/**
 * The Source page (#35, #87): the Source's heading and its Notes in Locator
 * order, with the writing box at its foot. Capture happens here; it has no
 * screen of its own. Genel bakış's Kaldığın yer opens the page ready to
 * write (`write`), a search result on the Note it found (`note`), every
 * other way in as for reading: the box closed and the list at the top. "Bu kaynakta ara"
 * narrows the list to the Notes that match and hides the writing box.
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
          <Text style={styles.lead}>{t('sourcePage.loadFailed')}</Text>
        ) : waitingForNetwork ? (
          <Text style={styles.lead}>{t('outbox.needsConnection')}</Text>
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
  const closeSearch = () => {
    setSearching(false);
    search.setText('');
  };
  const [expanded, setExpanded] = useState(false);
  // The Excerpt that offers "Yorum ekle", as the box says.
  const [commentable, setCommentable] = useState<string | null>(null);
  const composer = useRef<NoteComposerHandle>(null);
  const last = useMemo(() => lastCaptured(notes), [notes]);
  const list = useRef<FlatList<ListedNote>>(null);
  const pin = useRef<Pin | null>(
    write && last ? { id: last.note.id, at: 'box' } : found ? { id: found, at: 'middle' } : null,
  );
  const retries = useRef(0);

  // Again whenever the list's height or content changes: the keyboard opens, the box grows, a saved Note comes in.
  const scrollToPin = () => {
    const target = pin.current;
    const index = target ? listed.findIndex((n) => n.id === target.id) : -1;
    if (!target || index < 0) return;
    list.current?.scrollToIndex({ index, animated: false, viewPosition: target.at === 'box' ? 1 : 0.5 });
  };
  const pinAboveBox = (id: string) => {
    pin.current = { id, at: 'box' };
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
          headerTitle: () => <OutboxStatus />,
          headerRight: () => (
            <HeaderTextAction
              label={t('sourcePage.edit')}
              onPress={() => router.push({ pathname: '/source/[id]/edit', params: { id: source.id } })}
            />
          ),
        }}
      />
      {!expanded && (
        <FlatList
          ref={list}
          style={styles.screen}
          contentContainerStyle={styles.content}
          data={listed}
          extraData={[statuses, searched.matches, commentable]}
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
            <View style={styles.heading}>
              <View style={styles.identity}>
                <CoverEditor sourceId={source.id} type={source.type} cover={source.cover} />
                <View style={styles.identityText}>
                  <View style={styles.typeLine}>
                    <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
                    <ReadingStatusButton sourceId={source.id} status={source.readingStatus} />
                  </View>
                  <Text style={styles.title}>{source.title}</Text>
                  <Text style={styles.byline}>{byline}</Text>
                </View>
              </View>
              <SourceTags sourceId={source.id} names={source.tags.map((tag) => tag.name)} />
              {!searching && (
                <View style={styles.actions}>
                  <SourceSearchButton onPress={() => setSearching(true)} />
                </View>
              )}
              {searching && (
                <SourceSearchBar
                  text={search.text}
                  onChange={search.setText}
                  matches={searched.matches}
                  failed={searched.failed}
                  total={notes.length}
                  onClose={closeSearch}
                />
              )}
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{t(searched.matches ? 'noteSearch.sourceEmpty' : 'sourcePage.empty')}</Text>
          }
          renderItem={({ item: note, index }) => (
            <NoteRow
              note={note}
              divided={index > 0}
              match={searched.matches?.get(note.id)}
              status={statuses.get(note.id)}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
              action={
                note.id === commentable && <AddCommentButton onPress={() => composer.current?.commentOnLastExcerpt()} />
              }
              // A Note just come in is placed by estimate until its row is measured: place it again then.
              onLayout={() => {
                if (pin.current?.id === note.id) setTimeout(scrollToPin, 0);
              }}
            />
          )}
        />
      )}
      {/* Hidden rather than gone while searching, so a draft in it stays. */}
      <View style={[expanded && styles.screen, searching && styles.hidden]}>
        <NoteComposer
          ref={composer}
          sourceId={source.id}
          sourceType={source.type}
          carriedLocator={last?.note.locator ?? ''}
          carriedSince={last ? last.locatorSince.getTime() : Date.now()}
          expanded={expanded}
          onExpandedChange={setExpanded}
          autoFocus={write}
          onFocusChange={(focused) => {
            if (focused && last) pinAboveBox(last.note.id);
            else if (!focused) pin.current = null;
          }}
          onSaved={pinAboveBox}
          onCommentableChange={setCommentable}
        />
      </View>
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
  action,
}: {
  note: ListedNote;
  divided: boolean;
  /** What "Bu kaynakta ara" found in it, to mark. */
  match: Match | undefined;
  status: NoteStatus | undefined;
  onPress: () => void;
  onLayout: () => void;
  /** Under the Note's texts: "Yorum ekle" on the Excerpt saved last. */
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const shown = useShownStatus(status);
  // A button may not sit inside the row's own: the action goes under it, in the texts' column.
  const below = Boolean(action);
  const row = (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('sourcePage.editNote')}
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.row,
        !below && divided && styles.divided,
        below && styles.rowAbove,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.locatorColumn}>
        <Text style={styles.locator}>{note.locator ?? '—'}</Text>
      </View>
      <View style={styles.texts}>
        {note.excerpt && <MarkedText text={note.excerpt} marks={match?.excerpt} style={styles.excerpt} />}
        {note.comment && <MarkedText text={note.comment} marks={match?.comment} style={styles.comment} prefix="↳ " />}
        <NoteTagsLine names={note.tags.map((tag) => tag.name)} />
        {shown && <Text style={styles.status}>{t(`outbox.${shown}`)}</Text>}
      </View>
    </Pressable>
  );
  if (!below) return row;
  return (
    <View style={divided && styles.divided}>
      {row}
      <View style={styles.action}>{action}</View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.gutter, paddingBottom: space.lg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    pressed: { opacity: 0.7 },
    heading: {
      gap: 10,
      paddingTop: 2,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    identity: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    identityText: { flex: 1, gap: space.xs },
    typeLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    type: { ...typeScale.micro, color: c.accent },
    title: { ...typeScale.sourceTitle, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    hidden: { display: 'none' },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 10, paddingVertical: space.md },
    rowAbove: { paddingBottom: 0 },
    // Under the texts, past the Locator's column and the row's gap.
    action: { paddingLeft: 68 + 10, paddingTop: 6, paddingBottom: space.sm },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    locatorColumn: { width: 68, gap: space.xs, paddingTop: 4 },
    locator: { ...typeScale.locator, color: c.muted },
    texts: { flex: 1, gap: 6 },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
    status: { ...typeScale.caption, color: c.warn },
  });
