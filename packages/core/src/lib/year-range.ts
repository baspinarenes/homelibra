import { type Calendar, type CalendarDate, gregorianRange, sortValue } from './calendar-date';

/** A Başlangıç or Bitiş year of the Tarih filter, in its own calendar. */
export type YearBound = { calendar: Calendar; year: number };

/** The Tarih filter of Kaynaklar and Ara: either year may be left out. */
export type YearRange = { from?: YearBound | null; to?: YearBound | null };

/**
 * What a Tarih filter keeps (#40, story 164): the {@link sortValue}s from
 * the first day of the Başlangıç year to the last day of the Bitiş year,
 * whatever their calendars; null on a side without a year. `gregorian`
 * gives the Milâdî years of those two days, for the hint "≈ 1908–1914
 * Milâdî". Null when a year does not exist in its calendar (1400 r.).
 */
export function yearRange({ from, to }: YearRange): {
  min: number | null;
  max: number | null;
  gregorian: { from: number | null; to: number | null };
} | null {
  const first = from ? gregorianRange(from) : null;
  const last = to ? gregorianRange(to) : null;
  if ((from && !first) || (to && !last)) return null;
  return {
    min: from ? sortValue(from) : null,
    // The last day at its finest, so every Date of that day is kept.
    max: last ? sortValue({ calendar: 'gregorian', ...last.last }) : null,
    gregorian: { from: first?.first.year ?? null, to: last?.last.year ?? null },
  };
}

/**
 * Whether a Tarih filter keeps a Source with this Date, by the Date's first
 * day. A Source without a Date is hidden as soon as either year is set.
 */
export function inYearRange(date: CalendarDate | null, range: YearRange): boolean {
  const bounds = yearRange(range);
  if (!bounds) return false;
  if (bounds.min === null && bounds.max === null) return true;
  const value = date && sortValue(date);
  if (value === null) return false;
  return (bounds.min === null || value >= bounds.min) && (bounds.max === null || value <= bounds.max);
}
