import { calendars, type YearRange, yearRange } from '@homelibra/core/date';
import { type SQL, sql } from 'drizzle-orm';
import { z } from 'zod';

const yearBound = z.strictObject({ calendar: z.enum(calendars), year: z.int() });

/**
 * The Tarih filter of Kaynaklar and Ara: a Başlangıç and a Bitiş year, each
 * in its own calendar, either left out. A year its calendar does not have
 * (1400 r.) is refused.
 */
export const dateFilter = z
  .strictObject({ from: yearBound.nullish(), to: yearBound.nullish() })
  .refine((range) => yearRange(range) !== null, 'A year that does not exist in its calendar');

/**
 * What the filter keeps, on a Source's `date_sort` column: its Date's first
 * day from the first day of the Başlangıç year to the last of the Bitiş
 * year (core's {@link yearRange}); a Source without a Date is not kept.
 * Undefined while no year is set, when every Source is kept.
 */
export function inDates(range: YearRange | null | undefined, dateSort: SQL): SQL | undefined {
  const bounds = range && yearRange(range);
  if (!bounds || (bounds.min === null && bounds.max === null)) return undefined;
  const min = bounds.min === null ? sql`true` : sql`${dateSort} >= ${bounds.min}`;
  const max = bounds.max === null ? sql`true` : sql`${dateSort} <= ${bounds.max}`;
  return sql`(${min} and ${max})`;
}
