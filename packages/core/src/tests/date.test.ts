import { describe, expect, it } from 'vitest';

import { calendarMonths, formatDate, formatGregorianRange, gregorianRange, sortValue } from '../date';

const day = (year: number, month: number, d: number) => ({ year, month, day: d });

// Verification points from the calendar research (#17, docs/research/takvim-donusumu.md §4).
describe('gregorianRange', () => {
  it.each([
    ['29 Z 1310', 1310, 12, 29, day(1893, 7, 14)],
    ['15 Ca 1325', 1325, 5, 15, day(1907, 6, 26)],
    ['4 S 1088', 1088, 2, 4, day(1677, 4, 8)],
    ['28 R 1335', 1335, 4, 28, day(1917, 2, 21)],
    ['9 C 1344', 1344, 6, 9, day(1925, 12, 25)],
    ['1 M 1300', 1300, 1, 1, day(1882, 11, 12)],
  ])('turns Hicrî %s into a Milâdî day by the arithmetic civil calendar', (_, year, month, d, gregorian) => {
    expect(gregorianRange({ calendar: 'hijri', year, month, day: d })).toEqual({ first: gregorian, last: gregorian });
  });

  it('agrees with ICU’s islamic-civil calendar on every month start from 1200 to 1340', () => {
    const icu = new Intl.DateTimeFormat('en-u-ca-islamic-civil', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const mismatches: string[] = [];
    for (let year = 1200; year <= 1340; year++) {
      for (let month = 1; month <= 12; month++) {
        const { first } = gregorianRange({ calendar: 'hijri', year, month })!;
        const parts = icu.formatToParts(Date.UTC(first.year, first.month - 1, first.day));
        const part = (type: string) => Number.parseInt(parts.find((p) => p.type === type)!.value);
        if (part('year') !== year || part('month') !== month || part('day') !== 1) mismatches.push(`${month}/${year}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('spans a Hicrî month from its 1st to its last day', () => {
    expect(gregorianRange({ calendar: 'hijri', year: 1310, month: 12 })).toEqual({
      first: day(1893, 6, 16),
      last: day(1893, 7, 14),
    });
    expect(gregorianRange({ calendar: 'hijri', year: 1325, month: 5 })?.first).toEqual(day(1907, 6, 12));
  });

  it('spans a Hicrî year from 1 Muharrem to the end of Zilhicce', () => {
    expect(gregorianRange({ calendar: 'hijri', year: 1310 })).toEqual({
      first: day(1892, 7, 26),
      last: day(1893, 7, 14),
    });
    expect(gregorianRange({ calendar: 'hijri', year: 1325 })?.first).toEqual(day(1907, 2, 14));
  });

  // Rumî months carry their civil numbers: Kânunusani 1, Şubat 2, Mart 3 … Kânunuevvel 12.
  it.each([
    ['1 Mart 1256, the start of Takvîmü’s-Sinîn', 1256, 3, 1, day(1840, 3, 13)],
    ['1 Mart 1288, with no year skipped', 1288, 3, 1, day(1872, 3, 13)],
    ['10 Temmuz 1324', 1324, 7, 10, day(1908, 7, 23)],
    ['1 Teşrinievvel 1324', 1324, 10, 1, day(1908, 10, 14)],
    ['1 Kânunusani 1324, in the next Milâdî year', 1324, 1, 1, day(1909, 1, 14)],
    ['14 Mart 1331', 1331, 3, 14, day(1915, 3, 27)],
    ['8 Şubat 1332', 1332, 2, 8, day(1917, 2, 21)],
    ['15 Şubat 1332, the last Julian day', 1332, 2, 15, day(1917, 2, 28)],
    ['1 Mart 1333, the first Gregorian day', 1333, 3, 1, day(1917, 3, 1)],
    ['20 Kânunusani 1337', 1337, 1, 20, day(1921, 1, 20)],
    ['26 Kânunuevvel 1341', 1341, 12, 26, day(1925, 12, 26)],
    ['1 Mart 1250, before 1256 by the TDV rule', 1250, 3, 1, day(1835, 3, 13)],
  ])('turns Rumî %s into a Milâdî day', (_, year, month, d, gregorian) => {
    expect(gregorianRange({ calendar: 'rumi', year, month, day: d })).toEqual({ first: gregorian, last: gregorian });
  });

  it('starts a Rumî year on 1 Mart up to 1333 and on 1 Kânunusani from 1334', () => {
    expect(gregorianRange({ calendar: 'rumi', year: 1334, month: 1, day: 1 })?.first).toEqual(day(1918, 1, 1));
    expect(gregorianRange({ calendar: 'rumi', year: 1341 })).toEqual({
      first: day(1925, 1, 1),
      last: day(1925, 12, 31),
    });
    expect(gregorianRange({ calendar: 'rumi', year: 1324 })?.first).toEqual(day(1908, 3, 14));
    expect(gregorianRange({ calendar: 'rumi', year: 1332 })).toEqual({
      first: day(1916, 3, 14),
      last: day(1917, 2, 28),
    });
    expect(gregorianRange({ calendar: 'rumi', year: 1333 })).toEqual({
      first: day(1917, 3, 1),
      last: day(1917, 12, 31),
    });
    expect(gregorianRange({ calendar: 'rumi', year: 1336 })).toEqual({
      first: day(1920, 1, 1),
      last: day(1920, 12, 31),
    });
  });

  it('spans a Rumî month, with a Julian leap day in Şubat', () => {
    expect(gregorianRange({ calendar: 'rumi', year: 1324, month: 10 })?.first).toEqual(day(1908, 10, 14));
    // Şubat 1315 is Julian February 1900, a leap month.
    expect(gregorianRange({ calendar: 'rumi', year: 1315, month: 2 })).toEqual({
      first: day(1900, 2, 13),
      last: day(1900, 3, 13),
    });
  });

  it('keeps a Milâdî date as it is', () => {
    expect(gregorianRange({ calendar: 'gregorian', year: 1893, month: 3, day: 5 })).toEqual({
      first: day(1893, 3, 5),
      last: day(1893, 3, 5),
    });
    expect(gregorianRange({ calendar: 'gregorian', year: 1893 })).toEqual({
      first: day(1893, 1, 1),
      last: day(1893, 12, 31),
    });
  });

  it.each([
    ['20 Şubat 1332 r., dropped by the 1917 reform', { calendar: 'rumi', year: 1332, month: 2, day: 20 }],
    ['Kânunusani 1333 r., a year of ten months', { calendar: 'rumi', year: 1333, month: 1 }],
    ['Şubat 1333 r., a year of ten months', { calendar: 'rumi', year: 1333, month: 2 }],
    ['29 Şubat 1324 r., not a Julian leap year', { calendar: 'rumi', year: 1324, month: 2, day: 29 }],
    ['1342 r., after the Rumî count ended', { calendar: 'rumi', year: 1342 }],
    ['1255 r., a skipped year', { calendar: 'rumi', year: 1255 }],
    ['1199 r., before the Rumî range', { calendar: 'rumi', year: 1199 }],
    ['30 Safer 1310', { calendar: 'hijri', year: 1310, month: 2, day: 30 }],
    ['30 Zilhicce 1310, not a leap year', { calendar: 'hijri', year: 1310, month: 12, day: 30 }],
    ['29 Şubat 1900', { calendar: 'gregorian', year: 1900, month: 2, day: 29 }],
    ['a 13th month', { calendar: 'gregorian', year: 1900, month: 13 }],
    ['a day without a month', { calendar: 'gregorian', year: 1900, day: 5 }],
    ['year 0', { calendar: 'hijri', year: 0 }],
    ['a fractional year', { calendar: 'gregorian', year: 1893.5 }],
  ] as const)('has no range for %s', (_, date) => {
    expect(gregorianRange(date)).toBeNull();
  });

  it('accepts a Hicrî leap year’s 30 Zilhicce', () => {
    // 1311 is the 21st year of its cycle, a leap year.
    expect(gregorianRange({ calendar: 'hijri', year: 1311, month: 12, day: 30 })).not.toBeNull();
  });
});

// The citation forms of the Source form decision (#18 §2).
describe('formatDate', () => {
  it.each([
    ['29 Z 1310', { calendar: 'hijri', year: 1310, month: 12, day: 29 }],
    ['Z 1310', { calendar: 'hijri', year: 1310, month: 12 }],
    ['15 Ca 1325', { calendar: 'hijri', year: 1325, month: 5, day: 15 }],
    ['1310 h.', { calendar: 'hijri', year: 1310 }],
    ['1310 r.', { calendar: 'rumi', year: 1310 }],
    ['Mart 1310 r.', { calendar: 'rumi', year: 1310, month: 3 }],
    ['14 Mart 1331 r.', { calendar: 'rumi', year: 1331, month: 3, day: 14 }],
    ['12 Kânunusani 1327', { calendar: 'rumi', year: 1327, month: 1, day: 12 }],
    ['Teşrinievvel 1324', { calendar: 'rumi', year: 1324, month: 10 }],
    ['5 Mart 1893', { calendar: 'gregorian', year: 1893, month: 3, day: 5 }],
    ['Ağustos 1893', { calendar: 'gregorian', year: 1893, month: 8 }],
    ['1893', { calendar: 'gregorian', year: 1893 }],
  ] as const)('writes %s', (expected, date) => {
    expect(formatDate(date)).toBe(expected);
  });
});

describe('calendarMonths', () => {
  it('lists Hicrî months with their archive abbreviation', () => {
    expect(calendarMonths('hijri').at(-1)).toEqual({ month: 12, name: 'Zilhicce', abbreviation: 'Z' });
  });

  it('lists Rumî months from Mart, the start of the fiscal year', () => {
    expect(calendarMonths('rumi').map((m) => m.name)).toEqual([
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Teşrinievvel',
      'Teşrinisani',
      'Kânunuevvel',
      'Kânunusani',
      'Şubat',
    ]);
  });
});

describe('sortValue', () => {
  const order = (...dates: Parameters<typeof sortValue>[0][]) => dates.map(sortValue);
  const ascending = (values: (number | null)[]) => values.every((v, i) => i === 0 || v! > values[i - 1]!);

  it('orders Dates of every calendar by their first day', () => {
    expect(
      ascending(
        order(
          { calendar: 'gregorian', year: 1893, month: 3, day: 5 },
          { calendar: 'hijri', year: 1310, month: 12, day: 29 },
          { calendar: 'hijri', year: 1325, month: 5, day: 15 },
          { calendar: 'rumi', year: 1324, month: 10, day: 1 },
          { calendar: 'gregorian', year: 1909 },
        ),
      ),
    ).toBe(true);
  });

  it('puts the coarser Date first when two start on the same day', () => {
    expect(
      ascending(
        order(
          { calendar: 'hijri', year: 1310 },
          { calendar: 'hijri', year: 1310, month: 1 },
          { calendar: 'hijri', year: 1310, month: 1, day: 1 },
        ),
      ),
    ).toBe(true);
  });

  it('fits a 32-bit integer', () => {
    const latest = sortValue({ calendar: 'hijri', year: 9999, month: 12, day: 29 })!;
    expect(Number.isSafeInteger(latest) && latest < 2 ** 31).toBe(true);
  });

  it('is null for a Date that does not exist', () => {
    expect(sortValue({ calendar: 'rumi', year: 1332, month: 2, day: 20 })).toBeNull();
  });
});

// The hint under the form's Date field (#18 §1).
describe('formatGregorianRange', () => {
  it.each([
    ['14 Temmuz 1893', { calendar: 'hijri', year: 1310, month: 12, day: 29 }],
    ['16 Haziran 1893 – 14 Temmuz 1893', { calendar: 'hijri', year: 1310, month: 12 }],
    ['Temmuz 1892 – Temmuz 1893', { calendar: 'hijri', year: 1310 }],
    ['14 Ocak 1909', { calendar: 'rumi', year: 1324, month: 1, day: 1 }],
  ] as const)('writes %s', (expected, date) => {
    expect(formatGregorianRange(date)).toBe(expected);
  });

  it('writes nothing for a Milâdî Date or one that does not exist', () => {
    expect(formatGregorianRange({ calendar: 'gregorian', year: 1893 })).toBeNull();
    expect(formatGregorianRange({ calendar: 'hijri', year: 1310, month: 2, day: 30 })).toBeNull();
  });
});
