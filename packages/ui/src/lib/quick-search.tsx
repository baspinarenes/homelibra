import Search from 'lucide-react-native/icons/search';
import { useState } from 'react';
import { Modal, Pressable, type Role, type TextInputKeyPressEvent, TextInput, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';
import { useTheme } from './use-theme';
import type { KeyPress } from './wide-layout';

/**
 * What a key does in the quick search window's box: `select` a row, `open`
 * one (the last row is "Ara'da tüm sonuçlar"), `openAll` (Ara with the same
 * query), `close`, or `stay` (⌘K again: held back from the browser, the
 * window left as it is). Null leaves the key to the box.
 */
export type QuickSearchKey = { select: number } | { open: number } | 'openAll' | 'close' | 'stay';

/** The key's step, for `count` rows with row `selected` selected. ↑↓ stop at the first and last row. */
export function quickSearchKey(
  press: KeyPress,
  { selected, count }: { selected: number; count: number },
): QuickSearchKey | null {
  const command = press.metaKey || press.ctrlKey;
  const key = press.key.toLocaleLowerCase('tr');
  if (key === 'escape') return 'close';
  // ⌥ chords are the browser's and AltGr's, as in the wide layout's shortcuts.
  if (press.altKey) return null;
  if (key === 'enter') return command ? 'openAll' : { open: selected };
  if (command) return key === 'k' ? 'stay' : null;
  if (key === 'arrowdown') return { select: Math.min(selected + 1, count - 1) };
  if (key === 'arrowup') return { select: Math.max(selected - 1, 0) };
  return null;
}

/** A run of a Note's words, `hit` where the search matched. */
export type QuickSearchMark = { text: string; hit: boolean };

/** One result: a Tag or a Source to go to, or a Note by its Locator and matching words. */
export type QuickSearchResult =
  | { kind: 'tag'; id: string; name: string; detail: string }
  | { kind: 'source'; id: string; title: string; detail: string }
  | { kind: 'note'; id: string; locator: string | null; snippet: readonly QuickSearchMark[] };

/** The window's words, in the app's language. */
export type QuickSearchLabels = {
  /** What screen readers call the window. */
  dialog: string;
  /** What screen readers call the box. */
  field: string;
  placeholder: string;
  /** The Esc key beside the box, as a button. */
  close: string;
  /** The heading over the Tags and Sources. */
  go: string;
  notes: string;
  tag: string;
  source: string;
  /** The last row, for the query as typed: "Ara'da tüm sonuçlar: «…»". */
  openAll: string;
  /** The keys at the foot: ↑↓, ↵, ⌘↵. */
  select: string;
  open: string;
  openAllHint: string;
};

type Props = {
  visible: boolean;
  query: string;
  onChangeQuery: (query: string) => void;
  /**
   * In any order: the window shows the Tags, then the Sources, then the Notes.
   * A new array selects the first row again, so keep the same one while the results are the same.
   */
  results: readonly QuickSearchResult[];
  /** Said in place of the results: none found, offline, failed. */
  message?: string | null;
  /** The results are for an earlier query, the next on its way: ↵ does not open one of them. */
  stale?: boolean;
  labels: QuickSearchLabels;
  onOpen: (result: QuickSearchResult) => void;
  /** Ara, with the query. */
  onOpenAll: () => void;
  onClose: () => void;
};

const order = { tag: 0, source: 1, note: 2 } as const;

// The rows' parent as ARIA has it for options; React Native's Role leaves it out, react-native-web passes it on.
const listbox = 'listbox' as Role;

/**
 * The wide tier's quick search (⌘K, or Ara ⌘K in the sidebar): a window over
 * the screen with a box, a few Tags and Sources under Git and Notes under
 * Notlar as the scholar types, and "Ara'da tüm sonuçlar" last. ↑↓ selects,
 * ↵ opens, ⌘↵ opens Ara with the same query, Esc or a tap outside closes.
 * Not a search of its own: the app hands it Ara's results.
 */
export function QuickSearch({
  visible,
  query,
  onChangeQuery,
  results,
  message,
  stale = false,
  labels,
  onOpen,
  onOpenAll,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const sorted = [...results].sort((a, b) => order[a.kind] - order[b.kind]);
  const shown = message ? [] : sorted;
  const go = shown.filter((result) => result.kind !== 'note');
  const notes = shown.filter((result) => result.kind === 'note');
  // The Ara row is the last, after every result.
  const count = shown.length + 1;

  // New results, or the window opened again, select the first row.
  const [selected, setSelected] = useState(0);
  const [seen, setSeen] = useState({ results, visible });
  if (seen.results !== results || seen.visible !== visible) {
    setSeen({ results, visible });
    setSelected(0);
  }

  const open = (index: number) => {
    const result = shown[index];
    if (!result) onOpenAll();
    else if (!stale) onOpen(result);
  };

  const onKeyPress = (event: TextInputKeyPressEvent) => {
    // On the web the event is the browser's keydown, as note-composer reads it.
    const press = event as unknown as Omit<KeyPress, 'key'> & {
      key?: string;
      preventDefault: () => void;
      nativeEvent?: { isComposing?: boolean };
    };
    // A tablet's event has its key only under nativeEvent: there the box's typing is all there is.
    if (press.key === undefined || press.nativeEvent?.isComposing) return;
    const { key, metaKey, ctrlKey, shiftKey, altKey } = press;
    const step = quickSearchKey({ key, metaKey, ctrlKey, shiftKey, altKey }, { selected, count });
    if (!step) return;
    press.preventDefault();
    if (step === 'close') onClose();
    else if (step === 'openAll') onOpenAll();
    else if (step === 'stay') return;
    else if ('select' in step) setSelected(step.select);
    else open(step.open);
  };

  const row = (result: QuickSearchResult, index: number) => (
    <ResultRow
      key={`${result.kind}:${result.id}`}
      result={result}
      labels={labels}
      selected={index === selected}
      stale={stale}
      onHover={() => setSelected(index)}
      onPress={() => open(index)}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-scrim px-gutter pt-[110px]">
        {/* Screen readers close with Esc; the dimmed screen is for a click. */}
        <Pressable aria-hidden className="absolute inset-0" onPress={onClose} />
        <View
          role="dialog"
          aria-modal
          aria-label={labels.dialog}
          className="w-full max-w-[640px] self-center overflow-hidden rounded-control bg-surface shadow-lift"
        >
          <View className="flex-row items-center gap-2.5 border-b border-line px-lg py-3.5">
            <Search color={colors.muted} size={18} strokeWidth={1.7} />
            <TextInput
              aria-label={labels.field}
              placeholder={labels.placeholder}
              placeholderTextColor={colors.muted2}
              value={query}
              onChangeText={onChangeQuery}
              onKeyPress={onKeyPress}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              className="type-body-lg min-w-0 flex-1 text-fg outline-none"
            />
            {/* Out of the Tab order, as the rows are: the keys stay the box's, which keeps them from the screen behind. */}
            <Pressable
              role="button"
              aria-label={labels.close}
              focusable={false}
              onPress={onClose}
              className="active:opacity-70"
            >
              <Key>Esc</Key>
            </Pressable>
          </View>
          <View role={listbox} aria-label={labels.dialog} className="py-1.5">
            {go.length > 0 && <GroupHeading label={labels.go} first />}
            {go.map((result, i) => row(result, i))}
            {notes.length > 0 && <GroupHeading label={labels.notes} first={go.length === 0} />}
            {notes.map((result, i) => row(result, go.length + i))}
            {message && (
              <Text variant="bodySm" color="muted" className="px-lg py-2">
                {message}
              </Text>
            )}
            <Pressable
              role="option"
              aria-selected={selected === count - 1}
              focusable={false}
              onHoverIn={() => setSelected(count - 1)}
              onPress={onOpenAll}
              className={cx(
                'flex-row items-center gap-md px-lg pt-2.5 pb-2 active:opacity-70',
                shown.length > 0 && 'mt-1.5 border-t border-line-soft',
                selected === count - 1 && 'bg-accent-soft',
              )}
            >
              <Text variant="button" className="min-w-0 flex-1" numberOfLines={1}>
                {labels.openAll}
              </Text>
              <Key>⌘↵</Key>
            </Pressable>
          </View>
          <View className="flex-row gap-3.5 border-t border-line bg-page px-lg py-2">
            <Hint keys="↑↓" label={labels.select} />
            <Hint keys="↵" label={labels.open} />
            <Hint keys="⌘↵" label={labels.openAllHint} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ResultRow({
  result,
  labels,
  selected,
  stale,
  onHover,
  onPress,
}: {
  result: QuickSearchResult;
  labels: QuickSearchLabels;
  selected: boolean;
  stale: boolean;
  onHover: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="option"
      aria-selected={selected}
      focusable={false}
      onHoverIn={onHover}
      onPress={onPress}
      className={cx(
        'flex-row items-center gap-md px-lg py-2 active:opacity-70',
        selected && 'bg-accent-soft',
        stale && 'opacity-60',
      )}
    >
      {result.kind === 'note' ? (
        <>
          <Text variant="locator" color="accent" className="w-14 shrink-0" numberOfLines={1}>
            {result.locator ?? ''}
          </Text>
          <Text variant="excerptSm" className="min-w-0 flex-1" numberOfLines={1}>
            {result.snippet.map((part, i) =>
              part.hit ? (
                <Text key={i} variant="excerptSm" color="fg" className="bg-mark">
                  {part.text}
                </Text>
              ) : (
                part.text
              ),
            )}
          </Text>
        </>
      ) : (
        <>
          <Text variant="micro" className="w-14 shrink-0">
            {result.kind === 'tag' ? labels.tag : labels.source}
          </Text>
          <Text
            variant={result.kind === 'tag' ? 'bodySm' : 'sourceTitleSm'}
            className="min-w-0 shrink"
            numberOfLines={1}
          >
            {result.kind === 'tag' ? result.name : result.title}
          </Text>
          <Text variant="caption" className="ml-auto shrink-0 pl-md" numberOfLines={1}>
            {result.detail}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function GroupHeading({ label, first }: { label: string; first: boolean }) {
  return (
    <Text variant="micro" className={cx('px-lg pb-1', first ? 'pt-2' : 'pt-md')}>
      {label}
    </Text>
  );
}

/** A key as the board draws it: mono, in a hairline box. */
function Key({ children }: { children: string }) {
  return (
    <View className="rounded-chip border border-line bg-surface px-1.25">
      <Text variant="count" color="ink2">
        {children}
      </Text>
    </View>
  );
}

function Hint({ keys, label }: { keys: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Key>{keys}</Key>
      <Text variant="caption" color="ink2">
        {label}
      </Text>
    </View>
  );
}
