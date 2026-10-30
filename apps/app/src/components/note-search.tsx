import type { AppRouter } from '@homelibra/api';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import X from 'lucide-react-native/icons/x';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, type TextStyle, View } from 'react-native';

import { useOffline } from '@/lib/network';
import { useSettled } from '@/lib/settled';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type Found = inferRouterOutputs<AppRouter>['search']['source'];

/** A Note the search found, with its Excerpt and Comment cut into runs, the matching words marked. */
export type Match = Found['notes'][number];
type Segment = NonNullable<Match['excerpt']>[number];

/** The Notes a search in a Source or a view found, by id; null while the box is empty. */
export type Matches = ReadonlyMap<string, Match>;

/**
 * A search box over Notes already on screen (#40, story 156): what is
 * typed, and the query once typing settles. The server finds and marks the
 * matches by the Library search's rules (ADR-0010); the screen narrows its
 * own list to them.
 */
export function useSearchText() {
  const [text, setText] = useState('');
  return { text, setText, query: useSettled(text.trim()) };
}

/** "Bu kaynakta ara": the Source's Notes that match. */
export function useSourceSearch(sourceId: string, query: string) {
  const trpc = useTRPC();
  return useMatches(
    query,
    useQuery({
      ...trpc.search.source.queryOptions({ sourceId, query }),
      enabled: query !== '',
      placeholderData: keepPreviousData,
    }),
  );
}

/** A Collection's search box: the Notes of its view that match. */
export function useCollectionSearch(id: string, query: string) {
  const trpc = useTRPC();
  return useMatches(
    query,
    useQuery({
      ...trpc.search.collection.queryOptions({ id, query }),
      enabled: query !== '',
      placeholderData: keepPreviousData,
    }),
  );
}

/** A Tag page's search box, for the view its switch shows. */
export function useTagSearch(tagId: string, includeSourceNotes: boolean, query: string) {
  const trpc = useTRPC();
  return useMatches(
    query,
    useQuery({
      ...trpc.search.tag.queryOptions({ tagId, includeSourceNotes, query }),
      enabled: query !== '',
      placeholderData: keepPreviousData,
    }),
  );
}

function useMatches(query: string, found: { data: Found | undefined; isError: boolean }) {
  const matches = useMemo(
    () => (query === '' || !found.data ? null : new Map(found.data.notes.map((note) => [note.id, note]))),
    [query, found.data],
  );
  return { matches, failed: query !== '' && found.isError };
}

/** What a Collection's view and a Tag's page have, as far as narrowing goes. */
type NarrowableView = { groups: { notes: { id: string }[] }[]; noteCount: number; sourceCount: number };

/**
 * A view narrowed to the Notes the search found: Source groups without one
 * go, and the counts are of what is left. What is visible is what the
 * Markdown copy takes (#40, story 118).
 */
export function narrowView<V extends NarrowableView>(view: V, matches: Matches | null): V {
  if (!matches) return view;
  const groups = view.groups
    .map((group) => ({ ...group, notes: group.notes.filter((note) => matches.has(note.id)) }))
    .filter((group) => group.notes.length > 0);
  return {
    ...view,
    groups,
    noteCount: groups.reduce((sum, group) => sum + group.notes.length, 0),
    sourceCount: groups.length,
  };
}

/**
 * The box itself: × empties it, `onClose` (when given) puts it away.
 * Offline it says a search needs the connection, so no result is taken
 * for "not yok" (#40, story 158).
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  onClose,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const offline = useOffline();
  return (
    <View style={styles.row}>
      <View style={styles.box}>
        <TextInput
          accessibilityLabel={placeholder}
          placeholder={offline ? t('outbox.searchNeedsConnection') : placeholder}
          editable={!offline}
          placeholderTextColor={colors.muted2}
          value={value}
          onChangeText={onChange}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />
        {value !== '' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('noteSearch.clear')}
            onPress={() => onChange('')}
            hitSlop={8}
            style={styles.clear}
          >
            <X color={colors.muted} size={18} strokeWidth={1.8} />
          </Pressable>
        )}
      </View>
      {onClose && (
        <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
          <Text style={styles.close}>{t('noteSearch.close')}</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * An Excerpt or a Comment with the words the search matched marked. When
 * the text has changed since the search ran, it shows as it is now, unmarked.
 */
export function MarkedText({
  text,
  marks,
  style,
  prefix = '',
}: {
  text: string;
  marks: Segment[] | null | undefined;
  style: TextStyle | TextStyle[];
  prefix?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const current = marks && marks.map((segment) => segment.text).join('') === text ? marks : null;
  return (
    <Text style={style}>
      {prefix}
      {current
        ? current.map((segment, i) =>
            segment.hit ? (
              <Text key={i} style={styles.hit}>
                {segment.text}
              </Text>
            ) : (
              segment.text
            ),
          )
        : text}
    </Text>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    box: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    input: {
      ...typeScale.body,
      flex: 1,
      minWidth: 0,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingLeft: 12,
      paddingRight: 36,
      paddingVertical: 8,
    },
    clear: { position: 'absolute', right: 10 },
    close: { ...typeScale.button, color: c.accent },
    hit: { backgroundColor: c.mark, color: c.fg },
  });
