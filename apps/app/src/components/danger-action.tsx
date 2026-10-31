import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** The red action at the very foot of a form that deletes what the form edits ("Notu sil", "Kaynağı sil"). */
export function DangerAction({
  label,
  onPress,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const inactive = busy || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.action, disabled && styles.inactive, pressed && styles.pressed]}
    >
      {busy ? <ActivityIndicator color={styles.label.color} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // At least 44pt to touch, as the design system asks.
    action: { minHeight: 44, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
    label: { ...typeScale.button, fontSize: 15, color: c.danger },
    inactive: { opacity: 0.45 },
    pressed: { opacity: 0.7 },
  });
