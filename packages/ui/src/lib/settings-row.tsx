import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Children, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { type Colors, space } from './tokens';
import { useThemedStyles } from './use-theme';

/**
 * One line that opens something (`.srow` on the Ayarlar boards): a label, an
 * optional value on the right, a chevron; at least 48 high. `danger` is for
 * the row that leads to what cannot be taken back (Hesabı sil).
 */
export function SettingsRow({
  label,
  value,
  tone = 'fg',
  onPress,
}: {
  label: string;
  /** Muted, before the chevron: the address an E-posta adresi row opens. */
  value?: string;
  tone?: 'fg' | 'danger';
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable role="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Text variant="body" color={tone} style={styles.label}>
        {label}
      </Text>
      {value ? (
        <Text variant="caption" style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <ChevronRight size={18} color={styles.chevron.color} />
    </Pressable>
  );
}

/** `SettingsRow`s one under another, a thin `lineSoft` rule between each two. */
export function SettingsRows({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={index > 0 && styles.divider}>
          {child}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48, paddingVertical: space.sm },
    pressed: { opacity: 0.6 },
    label: { flexGrow: 1, flexShrink: 0 },
    value: { flexShrink: 1 },
    chevron: { color: c.muted2 },
    divider: { borderTopWidth: 1, borderTopColor: c.lineSoft },
  });
