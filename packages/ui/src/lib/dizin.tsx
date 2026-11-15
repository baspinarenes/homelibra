import { type ComponentRef, type ReactNode, type Ref, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Chip } from './chip';
import { cx } from './cx';
import { type MenuItem, MoreMenu } from './menu';
import { Text } from './text';

/**
 * One of a wide Dizin's two columns, Dosyalar or Etiketler (#181): its
 * name and count over a rule, its own actions at the right (its order,
 * + Yeni dosya), then its rows. Screen readers find it as a region.
 */
export function DizinColumn({
  title,
  count,
  actions,
  children,
}: {
  title: string;
  /** Shown once the rows are loaded and there are some. */
  count?: number;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View role="region" aria-label={title} className="min-w-0 flex-1">
      <View className="flex-row items-center gap-1.5 border-b border-line px-5 pt-5 pb-2.5">
        <Text variant="micro" className="flex-1">
          {count === undefined ? title : `${title} · ${count}`}
        </Text>
        {actions}
      </View>
      {children}
    </View>
  );
}

type RowRef = Ref<ComponentRef<typeof Pressable>>;

/**
 * A Collection in a wide Dizin: its name and "15 not · 8 kaynak" over its
 * Tags as chips and when it last changed. A press, or ↵ once ↑↓ put the
 * focus on it, opens it; the row ↑↓ chose stands on the chip's ground.
 */
export function CollectionRow({
  name,
  counts,
  tags,
  noTags,
  changed,
  selected = false,
  onPress,
  onFocus,
  ref,
}: {
  name: string;
  /** Already worded: "15 not · 8 kaynak". */
  counts: string;
  tags: readonly string[];
  /** In place of the chips when it has no Tag: "etiketsiz". */
  noTags: string;
  /** When its name, Tags or switch last changed, worded: "dün". */
  changed: string;
  selected?: boolean;
  onPress: () => void;
  /** The row has the focus (↑↓ put it there, or Tab). */
  onFocus?: () => void;
  ref?: RowRef;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      ref={ref}
      role="link"
      aria-selected={selected}
      onPress={onPress}
      onFocus={onFocus}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className={cx(
        'gap-1 border-t border-line-soft px-5 py-2.5 active:opacity-70',
        (selected || hovered) && 'bg-chip-bg',
      )}
    >
      <View className="flex-row items-baseline gap-sm">
        <Text variant="sourceTitleSm" className="min-w-0 flex-1">
          {name}
        </Text>
        <Text variant="count">{counts}</Text>
      </View>
      <View className="flex-row flex-wrap items-center gap-xs">
        {tags.length > 0 ? tags.map((tag) => <Chip key={tag} label={tag} />) : <Text variant="caption">{noTags}</Text>}
        <Text variant="caption" className="ml-auto">
          {changed}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * A Tag in a wide Dizin: its name and "6 not · 1 kaynak"; a press, or ↵
 * once ↑↓ put the focus on it, opens its page. Its ⋯ (Yeniden adlandır,
 * Birleştir…, Sil) stands beside the link, in sight only while the pointer
 * is over the row, the row or the ⋯ has the focus, or its menu is open;
 * out of sight it keeps its room, and Tab still reaches it.
 */
export function TagRow({
  name,
  counts,
  menu,
  selected = false,
  onPress,
  onFocus,
  ref,
}: {
  name: string;
  /** Already worded: "6 not · 1 kaynak". */
  counts: string;
  menu: { label: string; items: readonly MenuItem[]; open: boolean; onOpenChange: (open: boolean) => void };
  selected?: boolean;
  onPress: () => void;
  /** The row has the focus (↑↓ put it there, or Tab). */
  onFocus?: () => void;
  ref?: RowRef;
}) {
  const [hovered, setHovered] = useState(false);
  // Anything in the row has the focus: the link or the ⋯.
  const [focused, setFocused] = useState(false);
  const lit = selected || hovered;
  const shown = lit || focused || menu.open;
  return (
    <View
      // Heard around the link and the ⋯ alike, so going from one to the other keeps the ⋯ in sight.
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cx('flex-row items-center gap-sm border-t border-line-soft pr-3', lit && 'bg-chip-bg')}
    >
      <Pressable
        ref={ref}
        role="link"
        aria-selected={selected}
        onPress={onPress}
        onFocus={onFocus}
        className="min-w-0 flex-1 flex-row items-baseline gap-2.5 py-2.5 pl-5 active:opacity-70"
      >
        <Text variant="body" color="fg" className="min-w-0 flex-1">
          {name}
        </Text>
        <Text variant="count">{counts}</Text>
      </Pressable>
      <View className={shown ? 'opacity-100' : 'opacity-0'}>
        <MoreMenu label={menu.label} items={menu.items} open={menu.open} onOpenChange={menu.onOpenChange} />
      </View>
    </View>
  );
}
