import Check from 'lucide-react-native/icons/check';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, fonts } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

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
  const styles = useThemedStyles(makeStyles);
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
            style={({ pressed }) => [styles.option, index > 0 && styles.divided, pressed && styles.pressed]}
          >
            <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
            {selected && <Check color={colors.accent} size={20} strokeWidth={1.6} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52 },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    pressed: { opacity: 0.7 },
    text: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 22, color: c.fg, flexShrink: 1 },
    selectedText: { fontFamily: fonts.sansSemiBold, color: c.accent },
  });
