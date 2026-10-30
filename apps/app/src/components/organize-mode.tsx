import type { AppRouter } from '@homelibra/api';
import { tagIdentity } from '@homelibra/core/tag';
import type { ListedNote, NoteStatus } from '@homelibra/outbox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, type GestureResponderEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segment } from '@/components/segment';
import { SourceTags } from '@/components/source-tags';
import { TagChips } from '@/components/tag-chips';
import { TagPicker } from '@/components/tag-picker';
import { SharedUndoBar } from '@/components/undo-bar';
import { useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

type Source = inferRouterOutputs<AppRouter>['sources']['get'];
type Filter = 'untagged' | 'all';

/** Tags kept as one-tap chips at the top, the last used first. */
const recentCount = 8;

/** A Note the phone's outbox has not sent yet (or whose Source is gone): Düzenle leaves it out, nor is it merged. */
const unsent = (status: NoteStatus | undefined) => status !== undefined && status !== 'synced';

/** Shift held on a web click: select every Note from the last one picked. */
function withShift(event: GestureResponderEvent) {
  const shift = Platform.OS === 'web' && (event.nativeEvent as { shiftKey?: boolean }).shiftKey === true;
  // The browser takes a Shift click for selecting text too: let go of that.
  if (shift)
    (globalThis as { getSelection?: () => { removeAllRanges: () => void } | null }).getSelection?.()?.removeAllRanges();
  return shift;
}

/**
 * "Düzenle · N etiketsiz" on the Source page (#13): enters Düzenle mode at
 * any time, also with nothing waiting ("Düzenle").
 */
export function OrganizeEntry({ count, onPress }: { count: number; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.entry, pressed && styles.pressed]}
    >
      <Text style={styles.entryLabel}>{count > 0 ? t('organize.enterCount', { count }) : t('organize.enter')}</Text>
    </Pressable>
  );
}

/** "yeni": the Note came into its Source after the last "Bitir". */
export function NewMark() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.newMark}>{t('organize.new')}</Text>;
}

/**
 * Düzenle mode (#13): the Source page's own list, not a screen of its own,
 * with the writing box hidden. Etiketsizler (the default) or Tümü, in
 * Locator order. A Note tagged here stays, faded and with its Tags, until
 * the mode is entered again. Tags used here stay as one-tap chips on top;
 * selected Notes get Tags all at once, with Geri al. Bitir writes the
 * moment on the Source and leaves the mode. Online only: the phone's
 * unsent Notes are left out; the Source page sends them before entering.
 */
export function OrganizeMode({
  source,
  notes,
  statuses,
  fresh,
  onClose,
}: {
  source: Source;
  notes: ListedNote[];
  statuses: ReadonlyMap<string, NoteStatus>;
  fresh: ReadonlySet<string>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('untagged');
  // The Notes untagged as the mode opened: tagged meanwhile, they stay in Etiketsizler.
  const [untaggedAtEntry] = useState(() => new Set(notes.filter((n) => n.tags.length === 0).map((n) => n.id)));
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [anchor, setAnchor] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);

  const workable = notes.filter((n) => !unsent(statuses.get(n.id)));
  const shown = filter === 'all' ? workable : workable.filter((n) => untaggedAtEntry.has(n.id) || n.tags.length === 0);
  const chosen = shown.filter((n) => selected.has(n.id)).map((n) => n.id);
  const allChosen = shown.length > 0 && chosen.length === shown.length;

  const remember = (names: string[]) =>
    setRecent((last) => {
      const identities = new Set(names.map(tagIdentity));
      return [...names, ...last.filter((name) => !identities.has(tagIdentity(name)))].slice(0, recentCount);
    });
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.notes.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.organize.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
    ]);

  // One Note's "+ etiket": what the picker leaves on it.
  const setNoteTags = useMutation(trpc.notes.update.mutationOptions({ onSuccess: refresh }));
  const bulkTag = useMutation(
    trpc.organize.tag.mutationOptions({
      onSuccess: async ({ undoToken }, { noteIds }) => {
        setSelected(new Set());
        offerServerUndo(t('organize.tagged', { count: noteIds.length }), undoToken);
        await refresh();
      },
    }),
  );
  const finish = useMutation(
    trpc.organize.finish.mutationOptions({
      onSuccess: async () => {
        onClose();
        offerUndo({ message: t('organize.finished', { title: source.title }) });
        await queryClient.invalidateQueries({ queryKey: trpc.organize.pathKey() });
      },
    }),
  );

  const tagChosen = (names: string[]) => {
    if (names.length === 0) return;
    if (chosen.length === 0) {
      offerUndo({ message: t('organize.pickFirst') });
      return;
    }
    remember(names);
    bulkTag.mutate({ noteIds: chosen, names });
  };

  const toggle = (id: string, range: boolean) => {
    const next = new Set(selected);
    const from = anchor ? shown.findIndex((n) => n.id === anchor) : -1;
    const to = shown.findIndex((n) => n.id === id);
    if (range && from >= 0 && to >= 0) {
      for (const n of shown.slice(Math.min(from, to), Math.max(from, to) + 1)) next.add(n.id);
    } else if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setAnchor(id);
  };

  const failed =
    setNoteTags.isError || bulkTag.isError
      ? t('organize.tagFailed')
      : finish.isError
        ? t('organize.finishFailed')
        : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              disabled={finish.isPending}
              onPress={() => finish.mutate({ sourceId: source.id })}
              hitSlop={8}
            >
              <Text style={styles.headerAction}>{t('organize.finish')}</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={shown}
        extraData={[selected, fresh]}
        keyExtractor={(note) => note.id}
        ListHeaderComponent={
          <View style={styles.heading}>
            <View style={styles.modeLine}>
              <Text style={styles.mode}>{t('organize.mode').toLocaleUpperCase('tr')}</Text>
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
                <Text style={styles.close}>{t('organize.close')}</Text>
              </Pressable>
            </View>
            <Text style={styles.title}>{source.title}</Text>
            <SourceTags sourceId={source.id} names={source.tags.map((tag) => tag.name)} />
            <Segment
              label={t('organize.filterLabel')}
              options={[
                { value: 'untagged', label: t('organize.untaggedOnly') },
                { value: 'all', label: t('organize.all') },
              ]}
              value={filter}
              onChange={setFilter}
            />
            {recent.length > 0 && (
              <View style={styles.recent}>
                <Text style={styles.recentLabel}>{t('organize.recentTags').toLocaleUpperCase('tr')}</Text>
                <View style={styles.chips}>
                  {recent.map((name) => (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      disabled={bulkTag.isPending}
                      onPress={() => tagChosen([name])}
                      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                    >
                      <Text style={styles.chipText}>{name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{filter === 'untagged' ? t('organize.noneLeft') : t('sourcePage.empty')}</Text>
        }
        renderItem={({ item: note, index }) => (
          <OrganizeRow
            note={note}
            divided={index > 0}
            fresh={fresh.has(note.id)}
            // Tagged since the mode opened: kept, faded.
            done={untaggedAtEntry.has(note.id) && note.tags.length > 0}
            selected={selected.has(note.id)}
            selecting={selected.size > 0}
            onToggle={(range) => toggle(note.id, range)}
            onOpen={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
            onTags={(names) => {
              const had = new Set(note.tags.map((tag) => tagIdentity(tag.name)));
              remember(names.filter((name) => !had.has(tagIdentity(name))));
              setNoteTags.mutate({ id: note.id, tags: names });
            }}
          />
        )}
      />
      {/* Where the writing box was: the selection and what to do with it. */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + space.sm }]}>
        <SharedUndoBar />
        {failed && <Text style={styles.error}>{failed}</Text>}
        <View style={styles.barRow}>
          <Text style={styles.count}>{t('organize.selected', { count: chosen.length })}</Text>
          <Pressable
            accessibilityRole="button"
            disabled={shown.length === 0}
            onPress={() => setSelected(allChosen ? new Set() : new Set(shown.map((n) => n.id)))}
            hitSlop={6}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.barAction}>{allChosen ? t('organize.clearSelection') : t('organize.selectAll')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={chosen.length === 0 || bulkTag.isPending}
            onPress={() => setPicking(true)}
            style={({ pressed }) => [
              styles.tagButton,
              chosen.length === 0 && styles.inactive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.tagButtonLabel}>{t('organize.tagSelected')}</Text>
          </Pressable>
        </View>
      </View>
      <TagPicker
        visible={picking}
        title={t('organize.selectedTitle')}
        value={[]}
        onDone={(names) => {
          setPicking(false);
          tagChosen(names);
        }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

/**
 * A Note in Düzenle mode: the box selects it (Shift on the web selects a
 * run); a long press does too, and on the phone, once something is selected,
 * so does a tap. Otherwise a tap opens note editing. Its Tags and "+ etiket"
 * sit under the text.
 */
function OrganizeRow({
  note,
  divided,
  fresh,
  done,
  selected,
  selecting,
  onToggle,
  onOpen,
  onTags,
}: {
  note: ListedNote;
  divided: boolean;
  fresh: boolean;
  done: boolean;
  selected: boolean;
  selecting: boolean;
  onToggle: (range: boolean) => void;
  onOpen: () => void;
  onTags: (names: string[]) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const tapSelects = selecting && Platform.OS !== 'web';
  return (
    <View style={[styles.row, divided && styles.divided, selected && styles.selectedRow]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={t('organize.select')}
        aria-checked={selected}
        onPress={(event) => onToggle(withShift(event))}
        hitSlop={8}
        style={[styles.box, selected && styles.boxChecked]}
      >
        {selected ? <Check size={14} strokeWidth={3} color={styles.mark.color} /> : null}
      </Pressable>
      <View style={[styles.rowBody, done && styles.done]}>
        <Pressable
          accessibilityRole="button"
          accessibilityHint={tapSelects ? undefined : t('sourcePage.editNote')}
          onPress={(event) => (tapSelects ? onToggle(withShift(event)) : onOpen())}
          onLongPress={() => onToggle(false)}
          style={({ pressed }) => [styles.noteText, pressed && styles.pressed]}
        >
          <View style={styles.locatorColumn}>
            <Text style={styles.locator}>{note.locator ?? '—'}</Text>
            {fresh && <NewMark />}
          </View>
          <View style={styles.texts}>
            {note.excerpt && <Text style={styles.excerpt}>{note.excerpt}</Text>}
            {note.comment && <Text style={styles.comment}>{`↳ ${note.comment}`}</Text>}
          </View>
        </Pressable>
        <View style={styles.tags}>
          <TagChips names={note.tags.map((tag) => tag.name)} pickerTitle={t('tags.noteTitle')} onChange={onTags} />
        </View>
      </View>
    </View>
  );
}

const locatorWidth = 84;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
    pressed: { opacity: 0.7 },
    inactive: { opacity: 0.45 },
    entry: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.button,
      paddingVertical: space.sm,
      paddingHorizontal: space.md,
    },
    entryLabel: { ...typeScale.button, color: c.accent },
    newMark: { ...typeScale.micro, color: c.warn },
    headerAction: { ...typeScale.button, fontSize: 15, color: c.accent, paddingHorizontal: space.sm },
    heading: {
      gap: space.md,
      paddingTop: space.sm,
      paddingBottom: space.lg,
      marginBottom: space.xs,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    modeLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    mode: { ...typeScale.micro, color: c.accent },
    close: { ...typeScale.button, color: c.accent },
    title: { ...typeScale.sourceTitle, color: c.fg },
    recent: { gap: 6 },
    recentLabel: { ...typeScale.micro, color: c.muted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.chip, backgroundColor: c.chipBg },
    chipText: { ...typeScale.label, color: c.chipInk },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
    row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    selectedRow: { backgroundColor: c.accentSoft },
    box: {
      width: 20,
      height: 20,
      marginTop: 4,
      borderRadius: radius.cover,
      borderWidth: 1.5,
      borderColor: c.lineStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxChecked: { backgroundColor: c.accent, borderColor: c.accent },
    mark: { color: c.accentFg },
    rowBody: { flex: 1, gap: 6 },
    done: { opacity: 0.5 },
    noteText: { flexDirection: 'row', gap: space.md },
    locatorColumn: { width: locatorWidth, gap: 2, paddingTop: 4 },
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
    tags: { paddingLeft: locatorWidth + space.md },
    bar: {
      gap: space.xs,
      paddingTop: space.sm,
      paddingHorizontal: space.lg,
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.page,
    },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
    count: { ...typeScale.label, flex: 1, color: c.ink2 },
    barAction: { ...typeScale.button, color: c.accent },
    tagButton: {
      borderRadius: radius.button,
      backgroundColor: c.accent,
      paddingVertical: space.sm,
      paddingHorizontal: space.lg,
    },
    tagButtonLabel: { ...typeScale.button, color: c.accentFg },
    error: { ...typeScale.caption, color: c.danger },
  });
