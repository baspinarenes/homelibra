import type { ComponentRef, ReactNode, Ref } from 'react';
import { Pressable, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';

export type TableColumn<K extends string> = {
  key: K;
  /** The heading, set in upper case. */
  label: string;
  /** Its width in px; a column without one takes what the others leave. */
  width?: number;
  /** `end` for figures (Not), lined up at the right. */
  align?: 'start' | 'end';
  /** Set on a column the rows can be sorted by: its heading becomes a button. */
  onSort?: () => void;
};

/** The column the rows are sorted by, and which way they run (↑ from A or the oldest, ↓ the other way). */
export type TableSort<K extends string> = { column: K; direction: 'asc' | 'desc' };

// A cell's room: its width, or the rest of the row. Each case its own whole string.
const cell = (column: TableColumn<string>) =>
  cx('px-md', column.width === undefined && 'min-w-0 flex-1', column.align === 'end' ? 'items-end' : 'items-start');
const widthOf = (column: TableColumn<string>) => (column.width === undefined ? undefined : { width: column.width });

/**
 * A table of rows under column headings (Kaynaklar on a wide screen, #179):
 * a heading that sorts is a button, the sorted one in `accent` with an arrow
 * for the way the rows run. Put the `TableHead` and the `TableRow`s inside.
 */
export function Table({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View role="table" aria-label={label} className="min-h-0 flex-1">
      {children}
    </View>
  );
}

export function TableHead<K extends string>({
  columns,
  sort,
}: {
  columns: readonly TableColumn<K>[];
  sort: TableSort<K>;
}) {
  return (
    <View role="row" className="flex-row border-b border-line">
      {columns.map((column) => {
        const sorted = sort.column === column.key;
        const arrow = sorted ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : '';
        const heading = (
          <Text variant="fieldLabel" color={sorted ? 'accent' : 'muted'} numberOfLines={1}>
            {`${column.label}${arrow}`}
          </Text>
        );
        return (
          <View
            key={column.key}
            role="columnheader"
            aria-sort={
              column.onSort ? (sorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none') : undefined
            }
            className={cell(column)}
            style={widthOf(column)}
          >
            {column.onSort ? (
              <Pressable
                role="button"
                aria-label={column.label}
                onPress={column.onSort}
                className="py-2.5 active:opacity-70"
              >
                {heading}
              </Pressable>
            ) : (
              <View className="py-2.5">{heading}</View>
            )}
          </View>
        );
      })}
    </View>
  );
}

/**
 * A row of the table, a cell per column: a press opens what it stands for.
 * The chosen row (↑↓ on a wide screen) stands on the `chipBg` ground. The
 * focus may be put on it (`ref`), and ↵ then presses it.
 */
export function TableRow<K extends string>({
  columns,
  cells,
  selected = false,
  onPress,
  onFocus,
  ref,
}: {
  columns: readonly TableColumn<K>[];
  cells: Record<K, ReactNode>;
  selected?: boolean;
  onPress: () => void;
  /** The row has the focus (↑↓ put it there, or Tab). */
  onFocus?: () => void;
  ref?: Ref<ComponentRef<typeof Pressable>>;
}) {
  return (
    <Pressable
      ref={ref}
      role="row"
      aria-selected={selected}
      onPress={onPress}
      onFocus={onFocus}
      className={cx('flex-row items-center border-b border-line-soft active:opacity-70', selected && 'bg-chip-bg')}
    >
      {columns.map((column) => (
        <View key={column.key} role="cell" className={cx(cell(column), 'py-2.25')} style={widthOf(column)}>
          {cells[column.key]}
        </View>
      ))}
    </Pressable>
  );
}
