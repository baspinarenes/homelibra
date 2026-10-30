import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/** A box and its label; the whole row toggles it. */
export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={checked}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.checked]}>
        {checked ? <Check size={14} strokeWidth={3} color={styles.mark.color} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
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
    mark: { color: c.accentFg },
    label: { ...typeScale.body, color: c.fg, flexShrink: 1 },
  });
