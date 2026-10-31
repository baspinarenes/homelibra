import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type Colors, type as typeScale } from './tokens';
import { useThemedStyles } from './use-theme';

/**
 * One part of a sheet that sets several things (Süz ve sırala, Süz): its
 * label in Turkish upper case, as a TextField's, and its control 6 under it.
 */
export function SheetField({ label, children }: { label: string; children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label.toLocaleUpperCase('tr')}</Text>
      {children}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    field: { gap: 6 },
    label: { ...typeScale.fieldLabel, color: c.muted },
  });
