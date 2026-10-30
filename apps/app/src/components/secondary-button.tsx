import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/** An outlined button for the second choice beside a PrimaryButton. */
export function SecondaryButton({
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
  const inactive = busy || disabled;
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.button, inactive && styles.inactive, pressed && styles.pressed]}
    >
      {busy ? <ActivityIndicator color={styles.label.color} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    button: {
      borderColor: c.line,
      borderWidth: 1,
      borderRadius: radius.button,
      paddingVertical: space.md - 1,
      paddingHorizontal: space.xl,
      alignItems: 'center',
    },
    inactive: { opacity: 0.5 },
    pressed: { opacity: 0.8 },
    label: { ...typeScale.button, fontSize: 15, color: c.fg },
  });
