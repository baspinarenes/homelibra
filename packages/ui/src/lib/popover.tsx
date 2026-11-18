import { type ReactNode, type RefObject, useRef, useState } from 'react';
import { Modal, Pressable, type PressableInstance, type Role, useWindowDimensions, View } from 'react-native';

import { cx } from './cx';

/**
 * What a button opens under itself, right-aligned to it, over the page: a
 * wide screen's ⋯ menu, Ara's tips. `trigger` draws the button with the
 * `ref` it is measured by and the `onPress` that opens and closes it; the
 * screen holds `open`. A press outside or Esc closes it. `gap` stands
 * between the button and what it opens; `className` sizes and fills it.
 */
export function AnchoredPopover({
  open,
  onOpenChange,
  trigger,
  role,
  label,
  gap = 4,
  className,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: (button: { ref: RefObject<PressableInstance | null>; onPress: () => void }) => ReactNode;
  role: Role;
  label: string;
  gap?: number;
  className?: string;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const button = useRef<PressableInstance>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);

  const show = () => {
    const at = button.current;
    if (!at) return onOpenChange(true);
    at.measureInWindow((x, y, w, h) => {
      setAnchor({ top: y + h + gap, right: Math.max(0, width - x - w) });
      onOpenChange(true);
    });
  };
  const close = () => onOpenChange(false);

  return (
    <>
      {trigger({ ref: button, onPress: open ? close : show })}
      <Modal visible={open} transparent onRequestClose={close}>
        <Pressable aria-hidden focusable={false} onPress={close} className="absolute inset-0" />
        <View
          role={role}
          aria-label={label}
          className={cx(
            'absolute rounded-control border border-line bg-surface shadow-lift',
            // Where the button was measured to stand is known only once it is pressed.
            !anchor && 'top-0 right-0',
            className,
          )}
          style={anchor ?? undefined}
        >
          {children}
        </View>
      </Modal>
    </>
  );
}
