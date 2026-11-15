import { Pressable, View } from 'react-native';

import { cx } from './cx';

/** An on/off switch, 40 × 24. Its label stands beside it on the screen; `label` names it for screen readers. */
export function Switch({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      role="switch"
      aria-checked={value}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={() => onChange(!value)}
      hitSlop={10}
      className={cx('h-6 w-10 rounded-pill', value ? 'bg-accent' : 'bg-line', disabled && 'opacity-45')}
    >
      <View
        className={cx('absolute top-0.5 h-5 w-5 rounded-pill bg-surface shadow-card', value ? 'left-4.5' : 'left-0.5')}
      />
    </Pressable>
  );
}
