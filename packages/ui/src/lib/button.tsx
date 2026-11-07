import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import type { IconComponent } from './icon';
import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

export type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'small' | 'text';

/**
 * The app's one button.
 * - `primary`: accent ground. `danger`: for the step that cannot be taken back.
 * - `secondary`: a frame, beside a primary one; with a `tone`, frame and word take that colour.
 * - `small`: a framed accent word in a row (Düzenle · 4 etiketsiz).
 * - `text`: a word alone (Çıkış yap), in `accent` or `danger`.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  tone,
  icon: Icon,
  block = false,
  onAccent = false,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** The colour of a `text` button (accent if unset), or of a `secondary` button's frame and word. */
  tone?: 'accent' | 'danger';
  /** A lucide icon before the label. */
  icon?: IconComponent;
  /** Full width. */
  block?: boolean;
  /** On an accent card (the ISBN/DOI card): a `small` button gets the light ground and no frame. */
  onAccent?: boolean;
  /** Spins in place of the label and takes no presses. */
  busy?: boolean;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const inactive = busy || disabled;
  const ink = {
    primary: colors.accentFg,
    danger: colors.accentFg,
    secondary: tone ? colors[tone] : colors.fg,
    small: colors.accent,
    text: colors[tone ?? 'accent'],
  }[variant];
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={inactive || undefined}
      aria-busy={busy || undefined}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        variant === 'secondary' && tone && { borderColor: colors[tone] },
        block && styles.block,
        onAccent && styles.onAccent,
        disabled && styles.off,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={ink} />
      ) : (
        <>
          {Icon && <Icon color={ink} size={variant === 'small' ? 16 : 18} strokeWidth={1.6} />}
          <Text style={[styles.label, variant === 'small' && styles.smallLabel, { color: ink }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      minHeight: 44,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: radius.control,
    },
    primary: { backgroundColor: c.accent },
    danger: { backgroundColor: c.danger },
    secondary: { borderWidth: 1, borderColor: c.line },
    small: { minHeight: 36, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: c.line },
    text: { paddingVertical: 0, paddingHorizontal: 4 },
    block: { alignSelf: 'stretch' },
    onAccent: { backgroundColor: c.accentFg, borderColor: 'transparent' },
    off: { opacity: 0.45 },
    pressed: { opacity: 0.8 },
    label: { ...typeScale.action },
    smallLabel: { ...typeScale.button },
  });
