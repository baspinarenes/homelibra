import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, type as typeScale } from './tokens';
import { useThemedStyles } from './use-theme';

/** Two or three options, one chosen; the chosen one is on `accent`, as a chosen Chip is. */
export function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
  block = false,
  compact = false,
}: {
  /** What screen readers call the choice. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Full width, the options sharing it equally. */
  block?: boolean;
  /** In a toolbar row (Not yazma alanı's Alıntı | Yorum): on the page colour, tighter, smaller words. */
  compact?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      role="radiogroup"
      aria-label={label}
      style={[styles.group, block && styles.block, compact && styles.compactGroup]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            role="radio"
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              block && styles.blockOption,
              compact && styles.compactOption,
              selected && styles.selected,
            ]}
          >
            <Text style={[styles.text, compact && styles.compactText, selected && styles.selectedText]}>
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
    compactGroup: { padding: 2, backgroundColor: c.page },
    compactOption: { paddingVertical: 4, paddingHorizontal: 11 },
    compactText: { fontSize: 13 },
    selected: { backgroundColor: c.accent },
    text: { ...typeScale.label, color: c.ink2 },
    selectedText: { color: c.accentFg },
  });
