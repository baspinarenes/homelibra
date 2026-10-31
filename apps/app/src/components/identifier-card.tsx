import { Button, type IconComponent } from '@homelibra/ui/button';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * The Source form's identifier card: the ISBN (Kitap) or the DOI (Makale) on
 * an accent ground, with the action that asks Open Library or Crossref
 * beside it and what came of asking below. `children` sit under a thin line
 * at the card's foot (the accepted cover).
 */
export function IdentifierCard({
  label,
  value,
  onChangeText,
  placeholder,
  action,
  hint,
  alert = false,
  children,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  action: { label: string; icon: IconComponent; onPress: () => void; disabled: boolean; busy: boolean };
  hint?: string | null;
  /** The hint says asking failed: set heavier. */
  alert?: boolean;
  children?: ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toLocaleUpperCase('tr')}</Text>
      <View style={styles.row}>
        <TextInput
          aria-label={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted2}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <View style={styles.action}>
          <Button variant="small" onAccent {...action} />
        </View>
      </View>
      {hint && (
        <Text role={alert ? 'alert' : 'status'} style={[styles.hint, alert && styles.alert]}>
          {hint}
        </Text>
      )}
      {children && <View style={[styles.foot, { borderTopColor: `${colors.accentFg}4D` }]}>{children}</View>}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    card: {
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: space.lg,
      backgroundColor: c.accent,
      borderRadius: radius.control,
    },
    label: { ...typeScale.fieldLabel, color: c.accentFg },
    row: { flexDirection: 'row', gap: space.sm },
    input: {
      ...typeScale.identifier,
      flex: 1,
      minWidth: 0,
      minHeight: 46,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.fg,
      backgroundColor: c.surface,
      borderRadius: radius.control,
      // Android adds its own padding above and below the line otherwise.
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    // The button keeps its own height, centred on the input's.
    action: { justifyContent: 'center' },
    hint: { ...typeScale.caption, color: c.accentFg },
    alert: typeScale.strong,
    // On-accent at 30%, set inline from the theme.
    foot: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: 10, borderTopWidth: 1 },
  });
