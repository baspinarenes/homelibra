import { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/**
 * A labelled text input. Every field looks the same, a Source's title too:
 * body 15/22 with 14px inside the edge, so the caret never touches it and
 * g, ğ, y, ş are not cut off below.
 */
export function TextField({
  label,
  required = false,
  error,
  quote = false,
  multiline = false,
  onFocus,
  onBlur,
  style,
  ...input
}: {
  label: string;
  required?: boolean;
  /** What is wrong with the value; shown below the field in `danger`. */
  error?: string;
  /** An Excerpt, in the quote face (Charis SIL, upright). */
  quote?: boolean;
} & TextInputProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const invalid = error !== undefined && error !== '';
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label.toLocaleUpperCase('tr')}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        aria-label={label}
        aria-invalid={invalid || undefined}
        placeholderTextColor={colors.muted2}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          quote && styles.quote,
          multiline && styles.multiline,
          invalid && styles.invalid,
          focused && styles.focused,
          style,
        ]}
        {...input}
      />
      {invalid && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    field: { gap: 6 },
    label: { ...typeScale.fieldLabel, color: c.muted },
    required: { color: c.accent },
    input: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 46,
      // Android adds its own padding above and below the line otherwise.
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    quote: { ...typeScale.excerpt, color: c.quoteInk },
    multiline: { minHeight: 92, textAlignVertical: 'top' },
    invalid: { borderColor: c.danger },
    // An accent border and a 3px accent-soft ring.
    focused: { borderColor: c.accent, outlineColor: c.accentSoft, outlineWidth: 3, outlineStyle: 'solid' },
    error: { ...typeScale.caption, color: c.danger },
  });
