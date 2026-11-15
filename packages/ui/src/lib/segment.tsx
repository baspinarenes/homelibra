import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';

/** Two or three options, one chosen; the chosen one is on `accent`, as a chosen Chip is. */
export function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
  block = false,
}: {
  /** What screen readers call the choice. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Full width, the options sharing it equally. */
  block?: boolean;
}) {
  return (
    <View
      role="radiogroup"
      aria-label={label}
      className={cx(
        'flex-row gap-0.5 rounded-control border border-line p-0.75',
        block ? 'self-stretch' : 'self-start',
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            className={cx('rounded-chip px-3.5 py-1.5', block && 'flex-1 items-center', selected && 'bg-accent')}
          >
            <Text variant="label" color={selected ? 'accentFg' : 'ink2'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
