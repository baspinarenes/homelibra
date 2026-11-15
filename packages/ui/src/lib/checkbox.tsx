import Check from 'lucide-react-native/icons/check';
import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';
import { useTheme } from './use-theme';

/** A box and its label; the whole row toggles it. */
export function Checkbox({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      className={cx('flex-row items-center gap-3 py-2', disabled && 'opacity-45')}
    >
      <View
        className={cx(
          'h-5 w-5 items-center justify-center rounded-cover border-[1.5px]',
          checked ? 'border-accent bg-accent' : 'border-line-strong',
        )}
      >
        {checked && <Check size={14} strokeWidth={3} color={colors.accentFg} />}
      </View>
      <Text variant="body" color="fg" className="shrink">
        {label}
      </Text>
    </Pressable>
  );
}
