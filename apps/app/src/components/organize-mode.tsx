import type { AppRouter } from '@homelibra/api';
import { tagIdentity } from '@homelibra/core/tag';
import type { ListedNote, NoteStatus } from '@homelibra/outbox';
import { Button } from '@homelibra/ui/button';
import { Checkbox } from '@homelibra/ui/checkbox';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { HeaderTextAction } from '@homelibra/ui/screen-header';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Segment } from '@homelibra/ui/segment';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, type GestureResponderEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectionActionsRow, useSelectionActions } from '@/components/selection-actions';
import { SourceTags } from '@/components/source-tags';
import { TagChips } from '@/components/tag-chips';
import { TagPicker } from '@/components/tag-picker';
import { SharedUndoBar } from '@/components/undo-bar';
import { useOrganizeKeys } from '@/lib/organize-keys';
import { refreshLibrary } from '@/lib/refresh-library';
import { useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';

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
  return (
    <Button
      label={count > 0 ? t('organize.enterCount', { count }) : t('organize.enter')}
      variant="small"
      onPress={onPress}
    />
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
 * selected Notes get Tags all at once, or are merged, moved or deleted
 * (selection-actions.tsx), each with Geri al; on the web by keys too
 * (j/k, x, t, Delete: lib/organize-keys.ts). Bitir writes the
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
  // The Note j/k stand on, on the web.
  const [cursor, setCursor] = useState<string | null>(null);
  const list = useRef<FlatList<ListedNote>>(null);

  const workable = notes.filter((n) => !unsent(statuses.get(n.id)));
  const shown = filter === 'all' ? workable : workable.filter((n) => untaggedAtEntry.has(n.id) || n.tags.length === 0);
  const chosen = shown.filter((n) => selected.has(n.id)).map((n) => n.id);
  const allChosen = shown.length > 0 && chosen.length === shown.length;
  const actions = useSelectionActions({
    sourceId: source.id,
    chosen: shown.filter((n) => selected.has(n.id)),
    onDone: () => setSelected(new Set()),
  });

  const remember = (names: string[]) =>
    setRecent((last) => {
      const identities = new Set(names.map(tagIdentity));
      return [...names, ...last.filter((name) => !identities.has(tagIdentity(name)))].slice(0, recentCount);
    });
  // Tags show in Collections as well as on the Notes.
  const refresh = () => refreshLibrary();

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
    setCursor(id);
  };

  const at = shown.findIndex((n) => n.id === cursor);
  useOrganizeKeys(
    {
      step: (by) => {
        if (shown.length === 0) return;
        const index = at < 0 ? (by > 0 ? 0 : shown.length - 1) : Math.min(Math.max(at + by, 0), shown.length - 1);
        setCursor(shown[index]!.id);
        list.current?.scrollToIndex({ index, viewPosition: 0.5 });
      },
      select: (range) => at >= 0 && toggle(shown[at]!.id, range),
      tag: () => {
        // With nothing selected, the Note under the cursor.
        if (chosen.length === 0 && at >= 0) setSelected(new Set([shown[at]!.id]));
        if (chosen.length > 0 || at >= 0) setPicking(true);
      },
      remove: actions.remove,
    },
    !picking && !actions.open,
  );

  const failed =
    setNoteTags.isError || bulkTag.isError
      ? t('organize.tagFailed')
      : finish.isError
        ? t('organize.finishFailed')
        : actions.failed
          ? t('selection.failed')
          : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderTextAction
              label={t('organize.finish')}
              disabled={finish.isPending}
              onPress={() => finish.mutate({ sourceId: source.id })}
            />
          ),
        }}
      />
      <FlatList
        ref={list}
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={shown}
        extraData={[selected, fresh, cursor]}
        onScrollToIndexFailed={({ index, averageItemLength }) =>
          list.current?.scrollToOffset({ offset: averageItemLength * index })
        }
        keyExtractor={(note) => note.id}
        ListHeaderComponent={
          <View style={styles.heading}>
            <SectionHeading title={t('organize.mode')} link={{ label: t('organize.close'), onPress: onClose }} />
            <Text style={styles.title}>{source.title}</Text>
            {Platform.OS === 'web' && <Text style={styles.keys}>{t('selection.keys')}</Text>}
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
                <SectionHeading title={t('organize.recentTags')} />
                <ChipRow>
                  {recent.map((name) => (
                    <Chip key={name} label={name} onPress={() => !bulkTag.isPending && tagChosen([name])} />
                  ))}
                </ChipRow>
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
            current={note.id === cursor}
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
          <Button
            label={allChosen ? t('organize.clearSelection') : t('organize.selectAll')}
            variant="text"
            disabled={shown.length === 0}
            onPress={() => setSelected(allChosen ? new Set() : new Set(shown.map((n) => n.id)))}
          />
          <View style={styles.tagButton}>
            <Button
              label={t('organize.tagSelected')}
              disabled={chosen.length === 0 || bulkTag.isPending}
              onPress={() => setPicking(true)}
            />
          </View>
        </View>
        <SelectionActionsRow actions={actions} />
      </View>
      {actions.sheets}
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
  current,
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
  /** Under the keyboard's cursor (j/k). */
  current: boolean;
  selecting: boolean;
  onToggle: (range: boolean) => void;
  onOpen: () => void;
  onTags: (names: string[]) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const tapSelects = selecting && Platform.OS !== 'web';
  return (
    <View style={[styles.row, divided && styles.divided, selected && styles.selectedRow, current && styles.current]}>
      <View style={styles.box}>
        <Checkbox
          label={t('organize.select')}
          hideLabel
          checked={selected}
          onChange={(_, event) => onToggle(withShift(event))}
        />
      </View>
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
            {note.comment && (
              <Text style={styles.comment}>
                <Text style={styles.arrow}>↳ </Text>
                {note.comment}
              </Text>
            )}
          </View>
        </Pressable>
        <View style={styles.tags}>
          <TagChips names={note.tags.map((tag) => tag.name)} pickerTitle={t('tags.noteTitle')} onChange={onTags} />
        </View>
      </View>
    </View>
  );
}

const locatorWidth = 56;
const rowGap = 10;

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.gutter, paddingBottom: space.lg },
    pressed: { opacity: 0.7 },
    newMark: { ...typeScale.micro, color: c.warn },
    heading: {
      gap: 10,
      paddingTop: 2,
      paddingBottom: space.md,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    title: { ...typeScale.sourceTitle, color: c.fg },
    recent: { gap: 10, paddingTop: space.xs },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
    row: { flexDirection: 'row', gap: rowGap, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    // The tint reaches 8 past the text on each side.
    selectedRow: { backgroundColor: c.accentSoft, paddingHorizontal: space.sm, marginHorizontal: -space.sm },
    // An outline, so the row keeps its place under the cursor.
    current: {
      outlineWidth: 2,
      outlineStyle: 'solid',
      outlineColor: c.accent,
      outlineOffset: 3,
      borderRadius: radius.cover,
    },
    keys: { ...typeScale.caption, color: c.muted },
    box: { paddingTop: 2 },
    rowBody: { flex: 1, gap: space.sm },
    done: { opacity: 0.5 },
    noteText: { flexDirection: 'row', gap: rowGap },
    locatorColumn: { width: locatorWidth, gap: space.xs, paddingTop: 4 },
    locator: { ...typeScale.locator, color: c.muted },
    texts: { flex: 1, gap: space.sm },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
    arrow: { color: c.muted2 },
    tags: { paddingLeft: locatorWidth + rowGap },
    bar: {
      gap: 6,
      paddingTop: 10,
      paddingHorizontal: space.gutter,
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.page,
    },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    count: { ...typeScale.label, color: c.ink2 },
    // Etiketle at the row's right end.
    tagButton: { marginLeft: 'auto' },
    error: { ...typeScale.caption, color: c.danger },
  });
