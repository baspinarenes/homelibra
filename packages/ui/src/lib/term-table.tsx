import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import type { Colors } from './tokens';
import { useThemedStyles } from './use-theme';

export type TermRow = { term: string; description: string };

/**
 * Terms and what they mean, two columns without headings: the term in mono at
 * the left, its description beside it, top-aligned, a thin rule between rows.
 */
export function TermTable({ rows }: { rows: readonly TermRow[] }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View role="table">
      {rows.map((row, index) => (
        <View key={row.term} role="row" style={[styles.row, index > 0 && styles.ruled]}>
          <Text variant="term" role="rowheader" style={styles.term}>
            {row.term}
          </Text>
          <Text variant="body" role="cell" style={styles.description}>
            {row.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingBottom: 10 },
    ruled: { borderTopWidth: 1, borderTopColor: c.lineSoft, paddingTop: 10 },
    // On the body's line, so the two columns' first lines share a baseline.
    term: { width: 120 },
    description: { flex: 1 },
  });
