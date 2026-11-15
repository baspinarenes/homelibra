import X from 'lucide-react-native/icons/x';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';
import type { Colors } from './tokens';
import { useTheme } from './use-theme';

export type ChipTone = 'tag' | 'add' | 'warn' | 'done' | 'outline';

const inks = {
  tag: 'chipInk',
  add: 'accent',
  warn: 'warn',
  done: 'accent',
  outline: 'ink2',
} as const satisfies Record<ChipTone, keyof Colors>;

// A bordered chip gives its 1px border back from its padding, so every chip is as tall.
// Each look names its own padding: two padding classes on one element fight on the web.
const filled = 'py-0.75 px-2.25';
const bordered = 'border py-0.5 px-2';
const looks = {
  tag: `bg-chip-bg ${filled}`,
  add: `${bordered} border-dashed border-line-strong`,
  warn: `bg-warn-soft ${filled}`,
  done: `bg-accent-soft ${filled}`,
  outline: `${bordered} border-line`,
} as const satisfies Record<ChipTone, string>;

const base = 'flex-row items-center self-start rounded-chip';
const chosen = `bg-accent ${filled}`;

/**
 * A small label: a Tag, a choice that toggles, an add button (+ etiket) or a
 * status (4 etiketsiz, bitti, okunuyor). Chosen chips are on `accent`, as a
 * Segment's chosen option is.
 */
export function Chip({
  label,
  tone = 'tag',
  selected,
  removable = false,
  onPress,
  onRemove,
  removeLabel,
}: {
  label: string;
  tone?: ChipTone;
  /** Set for a chip that toggles: whether it is chosen. */
  selected?: boolean;
  /** A chosen Tag that a press takes off: shows × after the label. */
  removable?: boolean;
  /** Makes the chip a button. Without it the chip only shows. */
  onPress?: () => void;
  /** An × of its own after the label, that takes the Tag out (a Collection's definition). */
  onRemove?: () => void;
  /** What screen readers call the ×. */
  removeLabel?: string;
}) {
  const { colors } = useTheme();
  const look = cx(base, selected ? chosen : looks[tone]);
  const ink = selected ? 'accentFg' : inks[tone];
  const shown = removable ? `${label} ×` : label;
  if (onRemove) {
    return (
      <View className={cx(look, 'gap-1 pr-1.25')}>
        <Text variant="labelSm" color={ink}>
          {label}
        </Text>
        <Pressable
          role="button"
          aria-label={removeLabel ?? label}
          onPress={onRemove}
          hitSlop={6}
          className="rounded-chip p-0.5 active:opacity-80"
        >
          <X color={colors.chipInk} size={13} strokeWidth={2} />
        </Pressable>
      </View>
    );
  }
  if (!onPress) {
    return (
      <View className={look}>
        <Text variant="labelSm" color={ink}>
          {shown}
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-pressed={selected}
      onPress={onPress}
      className={cx(look, 'active:opacity-80')}
    >
      <Text variant="labelSm" color={ink}>
        {shown}
      </Text>
    </Pressable>
  );
}

/** Chips side by side, wrapping onto the next line. */
export function ChipRow({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap gap-1.5">{children}</View>;
}
