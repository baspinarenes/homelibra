import { type Calendar, type CalendarDate, calendarMonths, calendarYear, type Month } from './calendar-date';

/**
 * A Date on the date picker's Gün · Ay · Yıl wheels (#112). Yıl always
 * stands on a year; Ay and Gün may stand on "—", and Gün only once Ay is
 * chosen.
 */
export type DateWheels = { calendar: Calendar; year: number; month: number | null; day: number | null };

// The years the Yıl wheel spans: Milâdî 1000–2100 and the same span in Hicrî;
// Rumî where it was used, from 1200 to 1341.
const spans: Record<Calendar, [number, number]> = {
  gregorian: [1000, 2100],
  hijri: [390, 1530],
  rumi: [1200, 1341],
};
// Where an empty field's Yıl starts, and where it goes when the new calendar has no such year: about 1900.
const startYears: Record<Calendar, number> = { gregorian: 1900, hijri: 1318, rumi: 1316 };

const yearExists = (calendar: Calendar, year: number) => calendarYear(calendar, year).months.length > 0;

/** The wheels a Date stands on; an empty field starts on Milâdî 1900 with Ay and Gün on "—". */
export function dateWheels(date: CalendarDate | null): DateWheels {
  if (!date) return { calendar: 'gregorian', year: startYears.gregorian, month: null, day: null };
  return { calendar: date.calendar, year: date.year, month: date.month ?? null, day: date.day ?? null };
}

/** The Date the wheels stand on. */
export function wheelsDate({ calendar, year, month, day }: DateWheels): CalendarDate {
  const date: CalendarDate = { calendar, year };
  if (month !== null) date.month = month;
  if (month !== null && day !== null) date.day = day;
  return date;
}

/**
 * What each wheel offers: the years of the calendar (up to `latestYear`, for
 * Erişim tarihi), the months of the year in the order the form lists them
 * (Rumî from Mart), and the days of the month. Gün is shut until Ay is
 * chosen, showing the days of the year's longest month.
 */
export function wheelChoices(
  { calendar, year, month }: DateWheels,
  { latestYear }: { latestYear?: number } = {},
): { years: number[]; months: Month[]; days: number[]; dayOpen: boolean } {
  const [first, span] = spans[calendar];
  const last = Math.min(span, latestYear ?? span);
  const years: number[] = [];
  for (let y = Math.min(first, year); y <= Math.max(last, year); y++) {
    if (y === year || (y >= first && y <= last && yearExists(calendar, y))) years.push(y);
  }
  const { months: inYear, days: daysIn } = calendarYear(calendar, year);
  const months = calendarMonths(calendar).filter((m) => inYear.includes(m.month));
  const dayOpen = month !== null && inYear.includes(month);
  const length = dayOpen ? daysIn(month) : Math.max(0, ...inYear.map(daysIn));
  return { years, months, days: Array.from({ length }, (_, i) => i + 1), dayOpen };
}

/**
 * The wheels after one of them turns. A new calendar clears Ay and Gün and
 * keeps Yıl, or moves it to about 1900 when the calendar has no such year;
 * a new year clears Ay and Gün when it lacks the month; Gün comes back to
 * the last day of a shorter month and clears when Ay goes back to "—".
 */
export function turnWheels(
  wheels: DateWheels,
  turn: { calendar: Calendar } | { year: number } | { month: number | null } | { day: number | null },
): DateWheels {
  if ('calendar' in turn) {
    if (turn.calendar === wheels.calendar) return wheels;
    const year = yearExists(turn.calendar, wheels.year) ? wheels.year : startYears[turn.calendar];
    return { calendar: turn.calendar, year, month: null, day: null };
  }
  const next = { ...wheels, ...turn };
  if (next.month === null) return { ...next, day: null };
  const { months, days } = calendarYear(next.calendar, next.year);
  if (!months.includes(next.month)) return { ...next, month: null, day: null };
  return { ...next, day: next.day === null ? null : Math.min(next.day, days(next.month)) };
}
