import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, type as typeScale, useThemedStyles } from '@/theme';

/** Two or three options; the chosen one is ink on paper. `compact` sits in a toolbar row (Capture's box). */
export function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.group, compact && styles.groupCompact]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[styles.option, compact && styles.optionCompact, selected && styles.selected]}
          >
            <Text style={[styles.text, compact && styles.textCompact, selected && styles.selectedText]}>
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
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
    },
    groupCompact: { padding: 2, backgroundColor: c.page },
    option: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.chip },
    optionCompact: { paddingVertical: 4, paddingHorizontal: 11 },
    selected: { backgroundColor: c.fg },
    text: { ...typeScale.label, color: c.ink2 },
    textCompact: { fontSize: 13 },
    selectedText: { color: c.page },
  });
