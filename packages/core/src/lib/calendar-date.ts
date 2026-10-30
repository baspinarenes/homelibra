// A Date in the calendar the source itself uses (ADR-0002). Conversions run
// through the Julian day number (JDN) and follow the calendar research
// (#17, docs/research/takvim-donusumu.md); they only order sources.

/** Milâdî, Hicrî and Rumî. Milâdî is the default. */
export const calendars = ['gregorian', 'hijri', 'rumi'] as const;

export type Calendar = (typeof calendars)[number];

/**
 * A Date as the scholar entered it: a year, an optional month and, when there
 * is a month, an optional day. Hicrî months are numbered from Muharrem;
 * Milâdî and Rumî ones by their civil number, so Rumî Kânunusani is 1 and
 * Mart 3 although the Rumî year began in Mart until 1333.
 */
export type CalendarDate = { calendar: Calendar; year: number; month?: number; day?: number };

/** A day in the Gregorian calendar. */
export type GregorianDay = { year: number; month: number; day: number };

type CalendarRules = {
  /** The months of a year in calendar order, or none when the year does not exist. */
  months(year: number): readonly number[];
  monthLength(year: number, month: number): number;
  toJdn(year: number, month: number, day: number): number;
};

const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const civilMonthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
const between = (year: number, from: number, to: number) => Number.isInteger(year) && year >= from && year <= to;

function gregorianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function julianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
}

const gregorianLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const civilMonthLength = (month: number, leap: boolean) => (month === 2 && leap ? 29 : civilMonthLengths[month - 1]!);

// Milâdî: the proleptic Gregorian calendar.
const gregorian: CalendarRules = {
  months: (year) => (between(year, 1, 9999) ? allMonths : []),
  monthLength: (year, month) => civilMonthLength(month, gregorianLeap(year)),
  toJdn: gregorianToJdn,
};

// Hicrî: the arithmetic civil calendar, Friday epoch (§1). Odd months have
// 30 days, even ones 29, and Zilhicce 30 in the 11 leap years of each 30.
const hijri: CalendarRules = {
  months: (year) => (between(year, 1, 9999) ? allMonths : []),
  monthLength: (year, month) => (month % 2 === 1 || (month === 12 && (14 + 11 * year) % 30 < 11) ? 30 : 29),
  toJdn: (year, month, day) =>
    day + Math.ceil(29.5 * (month - 1)) + 354 * (year - 1) + Math.floor((3 + 11 * year) / 30) + 1948440 - 1,
};

// Rumî: rules R1–R7 (§2). Julian until 15 Şubat 1332, then Gregorian; the
// year starts on 1 Mart until 1333, which had ten months, and on
// 1 Kânunusani from 1334 to 1341. Before 1256 the year number follows the
// TDV rule and skips 1221 and 1255.
const fiscalMonths = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2] as const;

function rumiCivilYear(year: number, month: number): number {
  const offset = year >= 1256 ? 584 : year >= 1222 ? 585 : 586;
  return year + offset + (year <= 1332 && month <= 2 ? 1 : 0);
}

const rumi: CalendarRules = {
  months: (year) => {
    if (!between(year, 1200, 1341) || year === 1221 || year === 1255) return [];
    if (year === 1333) return fiscalMonths.slice(0, 10);
    return year > 1333 ? allMonths : fiscalMonths;
  },
  monthLength: (year, month) => {
    if (year === 1332 && month === 2) return 15;
    const civilYear = rumiCivilYear(year, month);
    return civilMonthLength(month, year >= 1333 ? gregorianLeap(civilYear) : civilYear % 4 === 0);
  },
  toJdn: (year, month, day) => (year >= 1333 ? gregorianToJdn : julianToJdn)(rumiCivilYear(year, month), month, day),
};

const rules: Record<Calendar, CalendarRules> = { gregorian, hijri, rumi };

function jdnToGregorian(jdn: number): GregorianDay {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    year: 100 * b + d - 4800 + Math.floor(m / 10),
    month: m + 3 - 12 * Math.floor(m / 10),
    day: e - Math.floor((153 * m + 2) / 5) + 1,
  };
}

/** The days a Date stands for, as JDNs; null when the Date does not exist in its calendar. */
function jdnRange({ calendar, year, month, day }: CalendarDate): { first: number; last: number } | null {
  const { months, monthLength, toJdn } = rules[calendar];
  const valid = months(year);
  if (month === undefined) {
    if (day !== undefined || valid.length === 0) return null;
    const lastMonth = valid[valid.length - 1]!;
    return { first: toJdn(year, valid[0]!, 1), last: toJdn(year, lastMonth, monthLength(year, lastMonth)) };
  }
  if (!valid.includes(month)) return null;
  if (day === undefined) return { first: toJdn(year, month, 1), last: toJdn(year, month, monthLength(year, month)) };
  if (!Number.isInteger(day) || day < 1 || day > monthLength(year, month)) return null;
  const jdn = toJdn(year, month, day);
  return { first: jdn, last: jdn };
}

/**
 * The Gregorian days a Date stands for, from its first to its last day;
 * null when the Date does not exist in its calendar (30 Safer, 20 Şubat 1332).
 * Approximate: it orders sources and is never shown as the Date.
 */
export function gregorianRange(date: CalendarDate): { first: GregorianDay; last: GregorianDay } | null {
  const range = jdnRange(date);
  return range && { first: jdnToGregorian(range.first), last: jdnToGregorian(range.last) };
}

export type Month = { month: number; name: string; abbreviation?: string };

const gregorianNames = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
// Spellings from TDV, abbreviations from the Ottoman Archive guide (§3).
const hijriNames: [string, string][] = [
  ['Muharrem', 'M'],
  ['Safer', 'S'],
  ['Rebîülevvel', 'Ra'],
  ['Rebîülâhir', 'R'],
  ['Cemâziyelevvel', 'Ca'],
  ['Cemâziyelâhir', 'C'],
  ['Receb', 'B'],
  ['Şâban', 'Ş'],
  ['Ramazan', 'N'],
  ['Şevval', 'L'],
  ['Zilkade', 'Za'],
  ['Zilhicce', 'Z'],
];
const rumiNames = ['Kânunusani', ...gregorianNames.slice(1, 9), 'Teşrinievvel', 'Teşrinisani', 'Kânunuevvel'];

const months: Record<Calendar, readonly Month[]> = {
  gregorian: gregorianNames.map((name, i) => ({ month: i + 1, name })),
  hijri: hijriNames.map(([name, abbreviation], i) => ({ month: i + 1, name, abbreviation })),
  // Listed from Mart, the order of the fiscal year.
  rumi: fiscalMonths.map((month) => ({ month, name: rumiNames[month - 1]! })),
};

/** A calendar's months in the order the form lists them. */
export function calendarMonths(calendar: Calendar): readonly Month[] {
  return months[calendar];
}

/**
 * A Date as it is cited: Hicrî months by their abbreviation ("29 Z 1310"),
 * the others by name ("12 Kânunusani 1327", "5 Mart 1893"). A suffix names
 * the calendar when nothing else does: "1310 h.", "1310 r.", "Mart 1310 r.".
 */
export function formatDate({ calendar, year, month, day }: CalendarDate): string {
  const found = month === undefined ? undefined : months[calendar].find((m) => m.month === month);
  const monthText = found && (found.abbreviation ?? found.name);
  const text = [day, monthText, year].filter((part) => part !== undefined).join(' ');
  if (calendar === 'hijri' && month === undefined) return `${text} h.`;
  // Rumî Şubat to Eylül share their names with Milâdî; Teşrin and Kânun do not.
  if (calendar === 'rumi' && (month === undefined || (month >= 2 && month <= 9))) return `${text} r.`;
  return text;
}

const precision = (date: CalendarDate) => (date.month === undefined ? 0 : date.day === undefined ? 1 : 2);

/**
 * A number that orders Dates of every calendar by their first day; on the
 * same day the coarser Date comes first ("1310 h." before "1 M 1310").
 * Null when the Date does not exist in its calendar.
 */
export function sortValue(date: CalendarDate): number | null {
  const range = jdnRange(date);
  return range && range.first * 3 + precision(date);
}

/**
 * Whether a Date's Milâdî days are exact rather than approximate. Rumî from
 * 1256 is the Julian calendar with a fixed year offset, so it is exact; Hicrî
 * is arithmetic and can drift a day or two from the Ottoman reckoning; Rumî
 * before 1256 is numbered by an inferred rule (§2 R7).
 */
export function isExactInGregorian(date: CalendarDate): boolean {
  if (date.calendar === 'hijri') return false;
  return date.calendar === 'gregorian' || date.year >= 1256;
}

/**
 * The Milâdî days of a Hicrî or Rumî Date, for the hint under the
 * form's field: "14 Temmuz 1893", "16 Haziran 1893 – 14 Temmuz 1893", and to
 * the month for a year, "Temmuz 1892 – Temmuz 1893". Null for a Milâdî Date
 * and one that does not exist.
 */
export function formatGregorianRange(date: CalendarDate): string | null {
  if (date.calendar === 'gregorian') return null;
  const range = gregorianRange(date);
  if (!range) return null;
  const write = ({ year, month, day }: GregorianDay) =>
    formatDate({ calendar: 'gregorian', year, month, day: date.month === undefined ? undefined : day });
  const [first, last] = [write(range.first), write(range.last)];
  return first === last ? first : `${first} – ${last}`;
}
