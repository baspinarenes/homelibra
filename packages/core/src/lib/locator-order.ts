import { byCapture } from './captured-at';

// A time (dk:sn, sa:dk:sn) or a number, with a folio's b side right after it.
const token = /(\d+(?::\d+){1,2})|(\d+)(b(?!\p{L}))?/gu;

/**
 * The value a Locator sorts by (#2 §5): its numbers in the order written. A
 * folio's b side adds a half, a time counts in seconds, and anything that is
 * not a digit, Roman numerals too, is skipped. Null when there is no number.
 */
export function locatorSortValue(locator: string): number[] | null {
  const value = [...locator.matchAll(token)].map(([, time, number, side]) =>
    time !== undefined
      ? time.split(':').reduce((seconds, part) => seconds * 60 + Number(part), 0)
      : Number(number) + (side ? 0.5 : 0),
  );
  return value.length > 0 ? value : null;
}

/**
 * A sort value as the scholar sees and corrects it: "12b · 13". It reads
 * back through `locatorSortValue`, so a correction is typed like a Locator.
 */
export function formatSortValue(value: readonly number[]): string {
  return value.map((n) => (Number.isInteger(n) ? `${n}` : `${Math.floor(n)}b`)).join(' · ');
}

/** What a Note needs to take its place among its Source's Notes. */
export type Placeable = {
  /** A UUIDv7, so id order is capture order (ADR-0008). */
  id: string;
  /** Null speaks of the Source as a whole: Konumsuz. */
  locator: string | null;
  /** Derived from the Locator or corrected by hand; null when the Locator holds no number. */
  locatorSort: readonly number[] | null;
};

// Konumsuz first, then the unsortable Locators, then the sorted ones (#81).
const tier = (note: Placeable) => (note.locator === null ? 0 : note.locatorSort === null ? 1 : 2);

/** Number by number; a shorter value that starts the longer one comes first. */
function compareSortValues(a: readonly number[], b: readonly number[]) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i]! - b[i]!;
  }
  return a.length - b.length;
}

/**
 * Locator order, as the Source page lists a Source's Notes:
 * Notes without a Locator first, then those whose Locator holds no number,
 * then by sort value; within each, oldest first.
 */
export function compareNotes(a: Placeable, b: Placeable): number {
  return (
    tier(a) - tier(b) ||
    (a.locatorSort && b.locatorSort ? compareSortValues(a.locatorSort, b.locatorSort) : 0) ||
    byCapture(a, b)
  );
}
