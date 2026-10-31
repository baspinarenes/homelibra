import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, type as typeScale } from './tokens';
import { useThemedStyles } from './use-theme';

/** Two or three options, one chosen; the chosen one is on `accent`, as a chosen Chip is. */
export function Segment<T extends string>({
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
  const styles = useThemedStyles(makeStyles);
  return (
    <View role="radiogroup" aria-label={label} style={styles.group}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.selected]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
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
    option: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.chip },
    selected: { backgroundColor: c.accent },
    text: { ...typeScale.label, color: c.ink2 },
    selectedText: { color: c.accentFg },
  });
