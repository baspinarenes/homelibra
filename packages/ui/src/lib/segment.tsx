import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { type Colors, radius } from './tokens';
import { useThemedStyles } from './use-theme';

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
  const styles = useThemedStyles(makeStyles);
  return (
    <View role="radiogroup" aria-label={label} style={[styles.group, block && styles.block]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.option, block && styles.blockOption, selected && styles.selected]}
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    group: {
      flexDirection: 'row',
      alignSelf: 'flex-start',
      gap: 2,
      padding: 3,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
    },
    block: { alignSelf: 'stretch' },
    option: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.chip },
    blockOption: { flex: 1, alignItems: 'center' },
    selected: { backgroundColor: c.accent },
  });
