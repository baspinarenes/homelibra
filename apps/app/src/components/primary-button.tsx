import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

export function PrimaryButton({
  label,
  onPress,
  busy = false,
  disabled = false,
  destructive = false,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  /** For the one step that cannot be taken back, such as Hesabı sil. */
  destructive?: boolean;
}) {
  const inactive = busy || disabled;
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        destructive && styles.destructive,
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={styles.label.color} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    button: {
      backgroundColor: c.accent,
      borderRadius: radius.button,
      paddingVertical: space.md,
      paddingHorizontal: space.xl,
      alignItems: 'center',
    },
    destructive: { backgroundColor: c.danger },
    inactive: { opacity: 0.5 },
    pressed: { opacity: 0.8 },
    label: { ...typeScale.button, fontSize: 15, color: c.accentFg },
  });
