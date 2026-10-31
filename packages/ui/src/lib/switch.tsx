import { Pressable, StyleSheet, View } from 'react-native';

import { type Colors, radius } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/** An on/off switch, 40 × 24. Its label stands beside it on the screen; `label` names it for screen readers. */
export function Switch({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { shadow } = useTheme();
  return (
    <Pressable
      role="switch"
      aria-checked={value}
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={() => onChange(!value)}
      hitSlop={10}
      style={[styles.track, value && styles.on, disabled && styles.off]}
    >
      <View style={[styles.knob, value && styles.knobOn, { boxShadow: shadow.card }]} />
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    track: { width: 40, height: 24, borderRadius: radius.pill, backgroundColor: c.line },
    on: { backgroundColor: c.accent },
    off: { opacity: 0.45 },
    knob: {
      position: 'absolute',
      top: 2,
      left: 2,
      width: 20,
      height: 20,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
    },
    knobOn: { left: 18 },
  });
