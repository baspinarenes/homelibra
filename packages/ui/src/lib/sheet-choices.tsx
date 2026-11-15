import Check from 'lucide-react-native/icons/check';
import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';
import { useTheme } from './use-theme';

/**
 * A sheet that is one choice (Sırala): its options on 52px lines with a thin
 * rule between, the chosen one in `accent` with a check at its right. A press
 * is the whole answer; the sheet needs no main action.
 */
export function SheetChoices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  /** What screen readers call the choice. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();
  return (
    <View role="radiogroup" aria-label={label}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            className={cx(
              'min-h-13 flex-row items-center justify-between gap-3 active:opacity-70',
              index > 0 && 'border-t border-line-soft',
            )}
          >
            <Text variant={selected ? 'choiceStrong' : 'choice'} className="shrink">
              {option.label}
            </Text>
            {selected && <Check color={colors.accent} size={20} strokeWidth={1.6} />}
          </Pressable>
        );
      })}
    </View>
  );
}
