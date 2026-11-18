import Ellipsis from 'lucide-react-native/icons/ellipsis';
import { Pressable, type Role } from 'react-native';

import { cx } from './cx';
import { Key } from './panel';
import { AnchoredPopover } from './popover';
import { Text } from './text';
import { useTheme } from './use-theme';

// React Native's Role leaves out an option of a choice in a menu; react-native-web writes it as given.
const menuItemRadio = 'menuitemradio' as Role;

export type MenuItem = {
  label: string;
  /** The shortcut that does the same, shown at the item's right (⌘⇧C). */
  keys?: string;
  /** `danger` for the step that cannot be taken back. */
  tone?: 'danger';
  disabled?: boolean;
  /** Set on each option of a choice (Sırala): whether it is the one in force. */
  checked?: boolean;
  onPress: () => void;
};

/**
 * A ⋯ button and the menu it opens under itself, right-aligned to it: the
 * wide header's place for what does not earn a button of its own
 * (Markdown olarak kopyala). With a `trigger` the button is that word and
 * ▾ instead, and the menu a choice (Dizin's Sırala: the order in force on
 * the button, its items `checked`). The screen holds `open`, so it knows
 * when the menu is in front of it. A press outside, Esc or choosing an item
 * closes it.
 */
export function MoreMenu({
  label,
  trigger,
  items,
  open,
  onOpenChange,
}: {
  /** What screen readers call the ⋯. */
  label: string;
  /** The button's word in place of ⋯: the choice in force. */
  trigger?: string;
  items: readonly MenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { colors } = useTheme();
  const close = () => onOpenChange(false);

  return (
    <AnchoredPopover
      open={open}
      onOpenChange={onOpenChange}
      role="menu"
      label={label}
      className="min-w-[240px] p-xs"
      trigger={({ ref, onPress }) => (
        <Pressable
          ref={ref}
          role="button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onPress={onPress}
          className={cx(
            'rounded-control active:opacity-70',
            trigger ? 'px-2.25 py-1.25' : 'p-1.75',
            open && 'bg-chip-bg',
          )}
        >
          {trigger ? (
            <Text variant="label" color="ink2">{`${trigger} ▾`}</Text>
          ) : (
            <Ellipsis color={colors.ink2} size={18} strokeWidth={1.8} />
          )}
        </Pressable>
      )}
    >
      {items.map((item) => (
        <Pressable
          key={item.label}
          role={item.checked === undefined ? 'menuitem' : menuItemRadio}
          aria-checked={item.checked}
          aria-label={item.label}
          aria-disabled={item.disabled || undefined}
          disabled={item.disabled}
          onPress={() => {
            close();
            item.onPress();
          }}
          className={cx(
            'flex-row items-center justify-between gap-md rounded-chip px-2.5 py-1.75 active:bg-accent-soft',
            item.disabled && 'opacity-45',
          )}
        >
          <Text variant="label" color={item.tone === 'danger' ? 'danger' : item.checked ? 'accent' : 'fg'}>
            {item.label}
          </Text>
          {item.keys && <Key keys={item.keys} />}
        </Pressable>
      ))}
    </AnchoredPopover>
  );
}
