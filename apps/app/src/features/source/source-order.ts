import type { AppRouter } from '@homelibra/api';
import type { inferRouterInputs } from '@trpc/server';

/** The orders `sources.list` sends Kaynaklar in: Son not, Başlık, Yazar, Tarih. */
export type SourceSort = inferRouterInputs<AppRouter>['sources']['list']['sort'];
export const sourceSorts = ['last', 'title', 'author', 'date'] as const satisfies readonly SourceSort[];

/** `asc` runs from A, the oldest date or the longest unnoted; `desc` the other way. */
export type Direction = 'asc' | 'desc';

/** Kaynaklar's order: an order of `sources.list`, and on a wide screen which way it runs (#179). */
export type SourceOrder = { sort: SourceSort; direction: Direction };

/** The way `sources.list` sends each order: Son not newest first, the others from A or the oldest. */
const natural: Record<SourceSort, Direction> = { last: 'desc', title: 'asc', author: 'asc', date: 'asc' };

export const naturalOrder = (sort: SourceSort): SourceOrder => ({ sort, direction: natural[sort] });

/** A column heading pressed: its order in its own direction, or the same order turned round. */
export function orderAfterPress(current: SourceOrder, sort: SourceSort): SourceOrder {
  if (current.sort !== sort) return naturalOrder(sort);
  return { sort, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

/** Every order as it is kept on the device, Son not newest first leading: what nothing kept reads as. */
export const storedOrders = [
  'last-desc',
  ...sourceSorts.flatMap((sort) => [`${sort}-asc`, `${sort}-desc`] as const).filter((kept) => kept !== 'last-desc'),
] as [StoredOrder, ...StoredOrder[]];
type StoredOrder = `${SourceSort}-${Direction}`;

export const storedOrder = ({ sort, direction }: SourceOrder): StoredOrder => `${sort}-${direction}`;

export function orderOf(stored: StoredOrder): SourceOrder {
  const [sort, direction] = stored.split('-') as [SourceSort, Direction];
  return { sort, direction };
}

type Ordered = { author: string | null; date: unknown; lastNoteAt: string | null };

/** Whether a Source has what the order goes by: the others come last, whichever way it runs. */
const has: Record<SourceSort, (source: Ordered) => boolean> = {
  last: (source) => source.lastNoteAt !== null,
  title: () => true,
  author: (source) => source.author !== null,
  date: (source) => source.date !== null,
};

/**
 * The rows `sources.list` sent in `order.sort`, run the way `order` says.
 * Turned round, the Sources without a Note, a Yazar or a Tarih stay last,
 * in the order they came (by Başlık), as they do in the order's own direction.
 */
export function inOrder<T extends Ordered>(rows: readonly T[], order: SourceOrder): T[] {
  if (order.direction === natural[order.sort]) return [...rows];
  const keyed = rows.filter(has[order.sort]);
  const rest = rows.filter((source) => !has[order.sort](source));
  return [...keyed.reverse(), ...rest];
}

/**
 * The row ↑ or ↓ chooses: the next one in that direction, stopping at either
 * end. With none chosen, or the chosen one gone from the list, either
 * starts at the first row: the one sure to be drawn and in sight.
 */
export function stepSelection(ids: readonly string[], selected: string | null, step: 'previous' | 'next') {
  if (ids.length === 0) return null;
  const at = selected === null ? -1 : ids.indexOf(selected);
  if (at === -1) return ids[0]!;
  return ids[Math.max(0, Math.min(ids.length - 1, at + (step === 'next' ? 1 : -1)))]!;
}
