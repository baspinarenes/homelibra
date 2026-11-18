import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';

/**
 * A setting and its options on one line (`.sr` on the wide Ayarlar board,
 * #183): the setting's name in a 160 px column, so the options of every row
 * start on one line, then the options as joined buttons, a `line` rule
 * between each two and the chosen one on `accent`. A press applies the
 * choice at once. A thin `lineSoft` rule runs under the row.
 */
export function InlineChoices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  /** The setting's name, also what screen readers call the choice. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="flex-row items-center gap-lg border-b border-line-soft py-md">
      <Text variant="body" color="fg" className="w-[160px] shrink-0">
        {label}
      </Text>
      <View
        role="radiogroup"
        aria-label={label}
        className="flex-row self-center overflow-hidden rounded-control border border-line bg-surface"
      >
        {options.map((option, index) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              role="radio"
              aria-checked={selected}
              onPress={() => onChange(option.value)}
              className={cx(
                'px-2.75 py-1.25 active:opacity-70',
                index > 0 && 'border-l border-line',
                selected && 'bg-accent',
              )}
            >
              <Text variant="labelSm" color={selected ? 'accentFg' : 'ink2'}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
