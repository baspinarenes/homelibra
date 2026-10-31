import Check from 'lucide-react-native/icons/check';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.row, disabled && styles.off]}
    >
      <View style={[styles.box, checked && styles.checked]}>
        {checked && <Check size={14} strokeWidth={3} color={colors.accentFg} />}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    box: {
      width: 20,
      height: 20,
      borderRadius: radius.cover,
      borderWidth: 1.5,
      borderColor: c.lineStrong,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checked: { backgroundColor: c.accent, borderColor: c.accent },
    label: { ...typeScale.body, color: c.fg, flexShrink: 1 },
    off: { opacity: 0.45 },
  });
