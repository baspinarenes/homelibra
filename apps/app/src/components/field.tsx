import { useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { type Colors, radius, type as typeScale, useTheme, useThemedStyles } from '@/theme';

/** A labelled text input from the design system (Input), as the Source form and note editing use it. */
export function Field({
  label,
  required = false,
  serif = false,
  quote = false,
  multiline = false,
  ...input
}: {
  label: string;
  required?: boolean;
  /** A Source's title. */
  serif?: boolean;
  /** An Excerpt, in the quote face. */
  quote?: boolean;
} & TextInputProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label.toLocaleUpperCase('tr')}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted2}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          serif && styles.inputSerif,
          quote && styles.inputQuote,
          multiline && styles.inputMultiline,
          focused && styles.focused,
        ]}
        {...input}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    field: { gap: 6 },
    label: { ...typeScale.micro, color: c.muted },
    required: { color: c.accent },
    input: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 46,
    },
    inputSerif: { fontFamily: typeScale.sourceTitle.fontFamily, fontSize: 19, lineHeight: 24 },
    inputQuote: { ...typeScale.excerpt, color: c.quoteInk },
    inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
    // Design system Input: accent border and a 3px accent-soft ring.
    focused: { borderColor: c.accent, outlineColor: c.accentSoft, outlineWidth: 3, outlineStyle: 'solid' },
  });
