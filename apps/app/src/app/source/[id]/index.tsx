import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { lastCaptured } from '@homelibra/core/note';
import { type ListedNote, type NoteStatus, withPendingNotes } from '@homelibra/outbox';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
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
import { NoteComposer } from '@/components/note-composer';
import { NewMark, OrganizeEntry, OrganizeMode } from '@/components/organize-mode';
import { OutboxStatus } from '@/components/outbox-status';
import { SourceTags } from '@/components/source-tags';
import { NoteTagsLine } from '@/components/tag-chips';
import { knownNotes } from '@/lib/known-notes';
import { useOnlineFirst } from '@/lib/online-first';
import { useOutbox } from '@/lib/outbox';
import { useTRPC } from '@/lib/trpc';
import { offerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

type Source = inferRouterOutputs<AppRouter>['sources']['get'];

// Tries at placing a Note whose row is not laid out yet, and the wait between them in ms.
const scrollRetries = 5;
const scrollRetryAfter = 50;

/** A Note the list keeps in view: just above the box while writing, or mid-screen when a search opened it. */
type Pin = { id: string; at: 'box' | 'middle' };

/**
 * The Source page (#35, #87): the Source's heading and its Notes in Locator
 * order, with the writing box at its foot. Capture happens here; it has no
 * screen of its own. "Devam et" opens the page ready to write (`write`), a
 * search result on the Note it found (`note`), every other way in as for
 * reading: the box closed and the list at the top.
 */
export default function SourceScreen() {
  const { id, write, note } = useLocalSearchParams<{ id: string; write?: string; note?: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
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
          <ActivityIndicator color={styles.spinner.color} />
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
  const trpc = useTRPC();
  // "Düzenle · N etiketsiz" and the Notes marked "yeni" (#53).
  const organize = useQuery(trpc.organize.source.queryOptions({ sourceId: source.id }));
  const fresh = useMemo(() => new Set(organize.data?.newNoteIds), [organize.data]);
  const [organizing, setOrganizing] = useState(false);
  // Düzenle mode is online only, and starts from what the outbox still had to send (#58).
  const onlineFirst = useOnlineFirst(useCallback(() => offerUndo({ message: t('outbox.needsConnection') }), [t]));
  const [expanded, setExpanded] = useState(false);
  // "Devam et" opens the box with the focus in it.
  const [writing, setWriting] = useState(write);
  // The Note saved last on this page.
  const [freshId, setFreshId] = useState<string | null>(null);
  const last = useMemo(() => lastCaptured(notes), [notes]);
  const list = useRef<FlatList<ListedNote>>(null);
  const pin = useRef<Pin | null>(
    write && last ? { id: last.note.id, at: 'box' } : found ? { id: found, at: 'middle' } : null,
  );
  const retries = useRef(0);

  // Again whenever the list's height or content changes: the keyboard opens, the box grows, a saved Note comes in.
  const scrollToPin = () => {
    const target = pin.current;
    const index = target ? notes.findIndex((n) => n.id === target.id) : -1;
    if (!target || index < 0) return;
    // Above the box with room for the marked Note's outline.
    const above = target.at === 'box';
    list.current?.scrollToIndex({
      index,
      animated: false,
      viewPosition: above ? 1 : 0.5,
      viewOffset: above ? -space.md : 0,
    });
  };
  const pinAboveBox = (id: string) => {
    pin.current = { id, at: 'box' };
    retries.current = 0;
    scrollToPin();
  };

  // Outlined: the Note saved last here, else the one captured last while writing, else the one a search opened.
  const marked = freshId ?? (writing ? last?.note.id : found) ?? null;

  // Yazar · Tarih · Künye notu · not sayısı, the Date as it was entered.
  const byline = [
    source.author,
    source.date && formatDate(source.date),
    source.bibliographicNote,
    t('sourcePage.noteCount', { count: notes.length }),
  ]
    .filter(Boolean)
    .join(' · ');

  // Düzenle mode is the same list, worked on; the writing box hides meanwhile.
  if (organizing)
    return (
      <OrganizeMode
        source={source}
        notes={notes}
        statuses={statuses}
        fresh={fresh}
        onClose={() => setOrganizing(false)}
      />
    );

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
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/source/[id]/edit', params: { id: source.id } })}
              hitSlop={8}
            >
              <Text style={styles.headerAction}>{t('sourcePage.edit')}</Text>
            </Pressable>
          ),
        }}
      />
      {!expanded && (
        <FlatList
          ref={list}
          style={styles.screen}
          contentContainerStyle={styles.content}
          data={notes}
          extraData={[marked, statuses]}
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
                  <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
                  <Text style={styles.title}>{source.title}</Text>
                </View>
              </View>
              <Text style={styles.byline}>{byline}</Text>
              <SourceTags sourceId={source.id} names={source.tags.map((tag) => tag.name)} />
              <OrganizeEntry
                count={organize.data?.untaggedCount ?? 0}
                onPress={() => void onlineFirst(() => setOrganizing(true))}
              />
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>{t('sourcePage.empty')}</Text>}
          renderItem={({ item: note, index }) => (
            <NoteRow
              note={note}
              divided={index > 0}
              marked={note.id === marked}
              fresh={fresh.has(note.id)}
              status={statuses.get(note.id)}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
              // A Note just come in is placed by estimate until its row is measured: place it again then.
              onLayout={() => {
                if (pin.current?.id === note.id) setTimeout(scrollToPin, 0);
              }}
            />
          )}
        />
      )}
      <NoteComposer
        sourceId={source.id}
        sourceType={source.type}
        carriedLocator={last?.note.locator ?? ''}
        carriedSince={last ? last.locatorSince.getTime() : Date.now()}
        expanded={expanded}
        onExpandedChange={setExpanded}
        autoFocus={write}
        onFocusChange={(focused) => {
          setWriting(focused);
          if (focused && last) pinAboveBox(last.note.id);
          else if (!focused) pin.current = null;
        }}
        onSaved={(id) => {
          setFreshId(id);
          pinAboveBox(id);
        }}
      />
    </KeyboardAvoidingView>
  );
}

/**
 * Locator on the left (— when it has none), Excerpt and ↳ Comment on the
 * right; under them, on the phone, where the outbox has the Note:
 * kuyrukta / gönderiliyor / eşitlendi / Kaynağı silinmiş. A Note still
 * waiting opens for editing too, through the outbox (#58).
 */
function NoteRow({
  note,
  divided,
  marked,
  fresh,
  status,
  onPress,
  onLayout,
}: {
  note: ListedNote;
  divided: boolean;
  marked: boolean;
  /** Came into the Source after its last "Bitir". */
  fresh: boolean;
  status: NoteStatus | undefined;
  onPress: () => void;
  onLayout: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const waiting = status !== undefined && status !== 'synced';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('sourcePage.editNote')}
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.row,
        divided && styles.divided,
        marked && styles.marked,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.locator}>{note.locator ?? '—'}</Text>
      <View style={styles.texts}>
        {note.excerpt && <Text style={styles.excerpt}>{note.excerpt}</Text>}
        {note.comment && <Text style={styles.comment}>{`↳ ${note.comment}`}</Text>}
        <View style={styles.marks}>
          <NoteTagsLine names={note.tags.map((tag) => tag.name)} />
          {fresh && <NewMark />}
        </View>
        {status && <Text style={[styles.status, waiting && styles.waiting]}>{t(`outbox.${status}`)}</Text>}
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    headerAction: { ...typeScale.button, fontSize: 15, color: c.accent, paddingHorizontal: space.sm },
    heading: {
      gap: space.md,
      paddingTop: space.sm,
      paddingBottom: 18,
      marginBottom: space.xs,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 13 },
    identityText: { flex: 1, gap: 2 },
    type: { ...typeScale.micro, color: c.accent },
    title: { ...typeScale.sourceTitle, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
    row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    // An outline, so the row keeps its place while marked.
    marked: {
      outlineWidth: 2,
      outlineStyle: 'solid',
      outlineColor: c.accent,
      outlineOffset: 3,
      borderRadius: radius.cover,
    },
    locator: { ...typeScale.locator, color: c.muted, width: 84, paddingTop: 4 },
    texts: { flex: 1, gap: 6 },
    marks: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
    status: { ...typeScale.caption, color: c.muted2 },
    waiting: { color: c.warn },
  });
