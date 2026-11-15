import { type Calendar, type CalendarDate, sortValue } from '@homelibra/core/date';

/** A Date as the form holds it: Gün and Yıl as text, Ay as a number. */
export type DateDraft = { calendar: Calendar; day: string; month: number | null; year: string };

export const emptyDateDraft: DateDraft = { calendar: 'gregorian', day: '', month: null, year: '' };

export function dateToDraft(date: CalendarDate | null | undefined): DateDraft {
  if (!date) return emptyDateDraft;
  return { calendar: date.calendar, day: date.day?.toString() ?? '', month: date.month ?? null, year: `${date.year}` };
}

type ReadDate =
  { date: CalendarDate | null; problem?: undefined } | { date?: undefined; problem: 'needsYear' | 'notInCalendar' };

/** The Date a draft holds: null when it is empty, a problem when it is not a Date yet. */
export function readDateDraft({ calendar, day, month, year }: DateDraft): ReadDate {
  if (!year.trim()) return day.trim() || month !== null ? { problem: 'needsYear' } : { date: null };
  const date: CalendarDate = { calendar, year: Number(year) };
  if (month !== null) date.month = month;
  if (month !== null && day.trim()) date.day = Number(day);
  return sortValue(date) === null ? { problem: 'notInCalendar' } : { date };
}
