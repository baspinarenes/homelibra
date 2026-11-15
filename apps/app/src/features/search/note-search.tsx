import type { AppRouter } from '@homelibra/api';
import { Key } from '@homelibra/ui/panel';
import { Text, type UpperCaseVariant, type Variant } from '@homelibra/ui/text';
import { cx, useTheme } from '@homelibra/ui/theme';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import Search from 'lucide-react-native/icons/search';
import X from 'lucide-react-native/icons/x';
import { type ComponentProps, type Ref, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, type TextInputInstance, View } from 'react-native';

import { useOffline } from '@/lib/network';
import { useSettled } from '@/features/search/settled';
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
 * readers. `frame` is a wide list's head (#172): the magnifier inside a box
 * that takes the accent and its ring while it has the cursor, and Esc at
 * its end in place of the ×, the key that puts it away (`onClose`) and a
 * press that does too. `inputRef` lets a key put the cursor back. Offline it says a search needs the connection, so no result is
 * taken for "not yok" (#40, story 158).
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  autoFocus = false,
  look = 'box',
  onClose,
  inputRef,
}: {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  look?: 'box' | 'bar' | 'line' | 'frame';
  onClose?: () => void;
  inputRef?: Ref<TextInputInstance>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const offline = useOffline();
  const [focused, setFocused] = useState(false);
  if (look === 'frame')
    return (
      <View
        className={cx(
          // The ring is always there, only coloured while the box has the cursor, as a TextField's.
          'min-h-9 flex-row items-center gap-sm rounded-control border bg-surface px-2.5 outline-3 outline-solid',
          focused ? 'border-accent outline-accent-soft' : 'border-line outline-transparent',
        )}
      >
        <Search color={colors.muted} size={16} strokeWidth={1.7} />
        <TextInput
          ref={inputRef}
          accessibilityLabel={placeholder}
          placeholder={offline ? t('outbox.searchNeedsConnection') : placeholder}
          editable={!offline}
          placeholderTextColor={colors.muted2}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          className={inputLooks.frame}
        />
        {onClose && (
          // Out of the Tab order: Esc is the key, the press is for the pointer.
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('noteSearch.close')}
            focusable={false}
            onPress={onClose}
            className="active:opacity-70"
          >
            <Key keys="Esc" />
          </Pressable>
        )}
      </View>
    );
  return (
    <View className={cx('flex-row items-center', look === 'line' && 'min-h-10 gap-sm border-b-2 border-accent')}>
      {look === 'line' && <Search color={colors.muted} size={16} strokeWidth={1.8} />}
      <TextInput
        ref={inputRef}
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
        className={inputLooks[look]}
      />
      {(onClose || value !== '') && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(onClose ? 'noteSearch.close' : 'noteSearch.clear')}
          onPress={onClose ?? (() => onChange(''))}
          hitSlop={8}
          className={xLooks[look]}
        >
          <X color={colors.muted} size={18} strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
}

// Each look names its own padding, so no two classes on the input set the same property.
const inputLooks = {
  box: 'min-w-0 flex-1 rounded-control border border-line bg-surface py-2 pr-9 pl-3 type-body text-fg',
  // Where a screen's title starts in the bar.
  bar: 'min-w-0 flex-1 p-0 pl-0.5 type-body text-fg',
  line: 'min-w-0 flex-1 p-0 type-body text-fg',
  // The box around it has the frame and the ring.
  frame: 'min-w-0 flex-1 py-1.5 type-body text-fg outline-none',
} as const;

const xLooks = {
  box: 'absolute right-2.5',
  // The 44 touch area every icon in the bar has.
  bar: 'h-11 w-11 items-center justify-center',
  line: undefined,
} as const;

/**
 * "«ad» 3 harften kısa, yalnızca tam kelime olarak aranır." for the query's
 * words the server named too short for a prefix match (#144), so a Note
 * missing for it is not missed unknowingly (ADR-0005). Nothing when there
 * are none. The same line in Ara and in a Source's or a view's box;
 * `centered` under an empty line.
 */
export function ShortWords({ words, centered = false }: { words: readonly string[] | undefined; centered?: boolean }) {
  const { t } = useTranslation();
  if (!words?.length) return null;
  return (
    <Text variant="caption" className={centered ? 'text-center' : undefined}>
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
  const current = marks && marks.map((segment) => segment.text).join('') === text ? marks : null;
  return (
    <Text variant={variant} color={color} style={style}>
      {prefix}
      {current
        ? current.map((segment, i) =>
            segment.hit ? (
              <Text key={i} variant={variant} color="fg" className="bg-mark">
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
