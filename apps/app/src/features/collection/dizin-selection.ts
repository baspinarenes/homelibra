import { stepSelection } from '@/features/source/source-order';

/** A wide Dizin's two columns, each by its rows' ids in the order shown. */
export type DizinColumns = { collections: readonly string[]; tags: readonly string[] };

/** The row ↑↓ chose: a Collection or a Tag, by its column and id. */
export type DizinRow = { column: keyof DizinColumns; id: string };

/** The chosen row while it is still in its column; none once it is gone (deleted, merged, renamed away). */
export function inDizin(columns: DizinColumns, chosen: DizinRow | null): DizinRow | null {
  return chosen && columns[chosen.column].includes(chosen.id) ? chosen : null;
}

/**
 * Where ↑ or ↓ takes the choice in a wide Dizin (#181): up or down its own
 * column, stopping at the ends; with none chosen, the first Collection (the
 * first Tag while there is none); with its row gone, the top of its column.
 * Tab, not ↑↓, crosses to the other column.
 */
export function stepInDizin(
  columns: DizinColumns,
  chosen: DizinRow | null,
  direction: 'previous' | 'next',
): DizinRow | null {
  const column = chosen?.column ?? (columns.collections.length > 0 ? 'collections' : 'tags');
  const id = stepSelection(columns[column], chosen?.id ?? null, direction);
  return id === null ? null : { column, id };
}
