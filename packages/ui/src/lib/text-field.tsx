import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { Text } from './text';
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
  labelHidden = false,
  error,
  excerpt = false,
  code = false,
  multiline = false,
  onChangeText,
  onFocus,
  onBlur,
  style,
  ...input
}: {
  label: string;
  required?: boolean;
  /** Not shown, only read out: where the sheet's title already says what goes in (Yeniden adlandır). */
  labelHidden?: boolean;
  /** What is wrong with the value; shown below the field in `danger`. */
  error?: string;
  /** Holds an Excerpt: set in the quote face (Charis SIL, upright). */
  excerpt?: boolean;
  /** A six-digit sign-in code: the number pad, the code from the email offered, digits only, in mono. */
  code?: boolean;
} & TextInputProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const invalid = error !== undefined && error !== '';
  return (
    <View style={styles.field}>
      {!labelHidden && (
        <View style={styles.label}>
          <Text variant="fieldLabel">{label}</Text>
          {required && (
            <Text variant="fieldLabel" color="accent">
              {' *'}
            </Text>
          )}
        </View>
      )}
      <TextInput
        aria-label={label}
        aria-invalid={invalid || undefined}
        placeholderTextColor={colors.muted2}
        multiline={multiline}
        {...(code && codeInput)}
        onChangeText={
          code && onChangeText ? (value) => onChangeText(value.replace(/\D/g, '').slice(0, 6)) : onChangeText
        }
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
          excerpt && styles.excerpt,
          code && styles.code,
          multiline && styles.multiline,
          invalid && styles.invalid,
          focused && styles.focused,
          style,
        ]}
        {...input}
      />
      {invalid && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

const codeInput: TextInputProps = {
  keyboardType: 'number-pad',
  inputMode: 'numeric',
  autoComplete: 'one-time-code',
  textContentType: 'oneTimeCode',
  maxLength: 6,
};

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    field: { gap: 6 },
    // The label and, when required, its star on one line.
    label: { flexDirection: 'row' },
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
      // The focus ring is always there, only coloured on focus: adding an outline to an Android
      // input redraws its background and drops its padding, the text then touching the border.
      outlineColor: 'transparent',
      outlineWidth: 3,
      outlineStyle: 'solid',
      // Android adds its own padding above and below the line otherwise.
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    excerpt: { ...typeScale.excerpt, color: c.quoteInk },
    code: {
      ...typeScale.signInCode,
      textAlign: 'center',
    },
    multiline: { minHeight: 92, textAlignVertical: 'top' },
    invalid: { borderColor: c.danger },
    // An accent border and a 3px accent-soft ring.
    focused: { borderColor: c.accent, outlineColor: c.accentSoft },
  });
