import type { AppRouter } from '@homelibra/api';
import { Text, type UpperCaseVariant, type Variant } from '@homelibra/ui/text';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { type ComponentProps, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useOffline } from '@/lib/network';
import { useSettled } from '@/lib/settled';
import { useTRPC } from '@/lib/trpc';

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
  return {
    matches,
    shortWords: (query !== '' && found.data?.shortWords) || [],
    failed: query !== '' && found.isError,
  };
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
 * The box itself. `look` is where it stands: `box` over a list, `bar` in the
 * top bar with no frame of its own, `line` on an accent rule under a
 * magnifier. The × inside empties it once there is text; given `onClose` it
 * is always there and puts the box away instead, named "Kapat" for screen
 * readers. Offline it says a search needs the connection, so no result is
 * taken for "not yok" (#40, story 158).
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  look = 'box',
  onClose,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  look?: 'box' | 'bar' | 'line';
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const offline = useOffline();
  const inputStyle = { box: styles.input, bar: [styles.bareInput, styles.barInput], line: styles.bareInput }[look];
  const xStyle = { box: styles.clear, bar: styles.barX, line: undefined }[look];
  return (
    <View style={[styles.box, look === 'line' && styles.line]}>
      {look === 'line' && <Search color={colors.muted} size={16} strokeWidth={1.8} />}
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={offline ? t('outbox.searchNeedsConnection') : placeholder}
        editable={!offline}
        // Without a box around it, the placeholder alone says this is a field.
        placeholderTextColor={look === 'box' ? colors.muted2 : colors.muted}
        value={value}
        onChangeText={onChange}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={inputStyle}
      />
      {(onClose || value !== '') && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(onClose ? 'noteSearch.close' : 'noteSearch.clear')}
          onPress={onClose ?? (() => onChange(''))}
          hitSlop={8}
          style={xStyle}
        >
          <X color={colors.muted} size={18} strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
}

/**
 * "«ad» 3 harften kısa, yalnızca tam kelime olarak aranır." for the query's
 * words the server named too short for a prefix match (#144), so a Note
 * missing for it is not missed unknowingly (ADR-0005). Nothing when there
 * are none. The same line in Ara and in a Source's or a view's box;
 * `centered` under an empty line.
 */
export function ShortWords({ words, centered = false }: { words: readonly string[] | undefined; centered?: boolean }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  if (!words?.length) return null;
  return (
    <Text variant="caption" style={centered && styles.centered}>
      {t('noteSearch.shortWords', { words: words.map((word) => `«${word}»`).join(', ') })}
    </Text>
  );
}

/**
 * An Excerpt or a Comment with the words the search matched marked. When
 * the text has changed since the search ran, it shows as it is now, unmarked.
 */
export function MarkedText({
  text,
  marks,
  variant,
  color,
  style,
  prefix = '',
}: {
  text: string;
  marks: Segment[] | null | undefined;
  variant: Exclude<Variant, UpperCaseVariant>;
  color?: ComponentProps<typeof Text>['color'];
  style?: ComponentProps<typeof Text>['style'];
  prefix?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const current = marks && marks.map((segment) => segment.text).join('') === text ? marks : null;
  return (
    <Text variant={variant} color={color} style={style}>
      {prefix}
      {current
        ? current.map((segment, i) =>
            segment.hit ? (
              <Text key={i} variant={variant} color="fg" style={styles.hit}>
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
    box: { flexDirection: 'row', alignItems: 'center' },
    line: { gap: space.sm, minHeight: 40, borderBottomWidth: 2, borderBottomColor: c.accent },
    bareInput: { ...typeScale.body, flex: 1, minWidth: 0, color: c.fg, paddingVertical: 0, paddingHorizontal: 0 },
    // Where a screen's title starts in the bar.
    barInput: { paddingLeft: 2 },
    input: {
      ...typeScale.body,
      flex: 1,
      minWidth: 0,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
      paddingLeft: 12,
      paddingRight: 36,
      paddingVertical: 8,
    },
    clear: { position: 'absolute', right: 10 },
    // The 44 touch area every icon in the bar has.
    barX: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    hit: { backgroundColor: c.mark },
    centered: { textAlign: 'center' },
  });
