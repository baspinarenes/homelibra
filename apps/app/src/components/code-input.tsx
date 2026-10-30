import { StyleSheet, TextInput } from 'react-native';

import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/** The six digits from an email, keeping only digits; `onSubmit` fires once all six are in. */
export function CodeInput({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (code: string) => void;
  onSubmit: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor={styles.placeholder.color}
      value={value}
      onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 6))}
      placeholder="000000"
      keyboardType="number-pad"
      inputMode="numeric"
      autoComplete="one-time-code"
      textContentType="oneTimeCode"
      maxLength={6}
      autoFocus
      onSubmitEditing={() => value.length === 6 && onSubmit()}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    input: {
      borderColor: c.line,
      borderWidth: 1,
      borderRadius: radius.input,
      paddingHorizontal: space.md,
      paddingVertical: space.md,
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      fontFamily: typeScale.locator.fontFamily,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: 8,
      textAlign: 'center',
    },
    placeholder: { color: c.muted2 },
  });
