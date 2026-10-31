import { type Colors, radius, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * The six digits from an email, keeping only digits; `onSubmit` fires once
 * all six are in. A TextField in the package's look, with the digits set
 * large and apart; `label` sits above it as a field's label does.
 */
export function CodeInput({
  label,
  value,
  onChange,
  onSubmit,
}: {
  label?: string;
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {label !== undefined && <Text style={styles.label}>{label.toLocaleUpperCase('tr')}</Text>}
      <TextInput
        aria-label={label}
        style={[styles.input, focused && styles.focused]}
        placeholderTextColor={colors.muted2}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="000000"
        keyboardType="number-pad"
        inputMode="numeric"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        onSubmitEditing={() => value.length === 6 && onSubmit()}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    field: { gap: 6 },
    label: { ...typeScale.fieldLabel, color: c.muted },
    input: {
      minHeight: 46,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
      backgroundColor: c.surface,
      color: c.fg,
      fontFamily: typeScale.locator.fontFamily,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: 8,
      textAlign: 'center',
      includeFontPadding: false,
    },
    // As a TextField in focus: an accent border and a 3px accent-soft ring.
    focused: { borderColor: c.accent, outlineColor: c.accentSoft, outlineWidth: 3, outlineStyle: 'solid' },
  });
