import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, space } from '@/theme';

export function PrimaryButton({
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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [styles.button, inactive && styles.inactive, pressed && styles.pressed]}
    >
      {busy ? <ActivityIndicator color={colors.accentFg} /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    alignItems: 'center',
  },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
  label: { color: colors.accentFg, fontSize: 16, fontWeight: '600' },
});
