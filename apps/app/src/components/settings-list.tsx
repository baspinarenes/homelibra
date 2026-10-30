import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** An unboxed block under a mono heading, ruled off from the one above. */
export function SettingsSection({
  title,
  first = false,
  children,
}: {
  title: string;
  first?: boolean;
  children: ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.section, !first && styles.divided]}>
      <Text style={styles.heading}>{title.toLocaleUpperCase('tr')}</Text>
      <View>{children}</View>
    </View>
  );
}

/**
 * One line that opens something: a label, an optional value on the right, a
 * chevron. Without `onPress` it is a place kept for a later ticket ("Yakında").
 */
export function SettingsRow({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const soon = !onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: soon }}
      disabled={soon}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={[styles.label, soon && styles.soonLabel]}>{label}</Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {soon ? (
        <Text style={styles.soon}>{t('placeholder.soon')}</Text>
      ) : (
        <ChevronRight size={18} color={styles.chevron.color} />
      )}
    </Pressable>
  );
}

/** Running text inside a section. */
export function SettingsText({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.text}>{children}</Text>;
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    section: { gap: space.sm, paddingVertical: space.lg },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    heading: { ...typeScale.micro, color: c.muted },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
    pressed: { opacity: 0.6 },
    label: { ...typeScale.body, color: c.fg, flexGrow: 1, flexShrink: 0 },
    soonLabel: { color: c.muted },
    value: { ...typeScale.caption, color: c.muted, flexShrink: 1 },
    soon: { ...typeScale.caption, color: c.muted2 },
    chevron: { color: c.muted2 },
    text: { ...typeScale.body, color: c.ink2, paddingVertical: space.xs },
  });
