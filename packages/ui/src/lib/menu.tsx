import Ellipsis from 'lucide-react-native/icons/ellipsis';
import { useRef, useState } from 'react';
import { Modal, Pressable, type PressableInstance, useWindowDimensions, View } from 'react-native';

import { cx } from './cx';
import { Key } from './panel';
import { Text } from './text';
import { useTheme } from './use-theme';

export type MenuItem = {
  label: string;
  /** The shortcut that does the same, shown at the item's right (⌘⇧C). */
  keys?: string;
  /** `danger` for the step that cannot be taken back. */
  tone?: 'danger';
  disabled?: boolean;
  onPress: () => void;
};

/**
 * A ⋯ button and the menu it opens under itself, right-aligned to it: the
 * wide header's place for what does not earn a button of its own
 * (Markdown olarak kopyala). The screen holds `open`, so it knows when the
 * menu is in front of it. A press outside, Esc or choosing an item closes it.
 */
export function MoreMenu({
  label,
  items,
  open,
  onOpenChange,
}: {
  /** What screen readers call the ⋯. */
  label: string;
  items: readonly MenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const button = useRef<PressableInstance>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);

  const show = () => {
    const at = button.current;
    if (!at) return onOpenChange(true);
    at.measureInWindow((x, y, w, h) => {
      setAnchor({ top: y + h + 4, right: Math.max(0, width - x - w) });
      onOpenChange(true);
    });
  };
  const close = () => onOpenChange(false);

  return (
    <>
      <Pressable
        ref={button}
        role="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onPress={open ? close : show}
        className={cx('rounded-control p-1.75 active:opacity-70', open && 'bg-chip-bg')}
      >
        <Ellipsis color={colors.ink2} size={18} strokeWidth={1.8} />
      </Pressable>
      <Modal visible={open} transparent onRequestClose={close}>
        <Pressable aria-hidden focusable={false} onPress={close} className="absolute inset-0" />
        <View
          role="menu"
          aria-label={label}
          className="absolute min-w-[240px] rounded-control border border-line bg-surface p-xs shadow-lift"
          // Where the ⋯ was measured to stand: known only once it is pressed.
          style={anchor ?? { top: 0, right: 0 }}
        >
          {items.map((item) => (
            <Pressable
              key={item.label}
              role="menuitem"
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
              <Text variant="label" color={item.tone === 'danger' ? 'danger' : 'fg'}>
                {item.label}
              </Text>
              {item.keys && <Key keys={item.keys} />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}
