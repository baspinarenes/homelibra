import { View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';

export type TermRow = { term: string; description: string };

/**
 * Terms and what they mean, two columns without headings: the term in mono at
 * the left, its description beside it, top-aligned, a thin rule between rows.
 */
export function TermTable({ rows }: { rows: readonly TermRow[] }) {
  return (
    <View role="table">
      {rows.map((row, index) => (
        <View
          key={row.term}
          role="row"
          className={cx('flex-row items-start gap-4 pb-2.5', index > 0 && 'border-t border-line-soft pt-2.5')}
        >
          {/* On the body's line, so the two columns' first lines share a baseline. */}
          <Text variant="term" role="rowheader" className="w-30">
            {row.term}
          </Text>
          <Text variant="body" role="cell" className="flex-1">
            {row.description}
          </Text>
        </View>
      ))}
    </View>
  );
}
