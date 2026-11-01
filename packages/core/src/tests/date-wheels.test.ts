import { describe, expect, it } from 'vitest';

import { dateWheels, turnWheels, wheelChoices, wheelsDate } from '../date';

// The date picker's Gün · Ay · Yıl wheels (#112).
describe('wheelChoices', () => {
  it('lists Rumî months from Mart, and only the ten of 1333', () => {
    const names = (year: number) =>
      wheelChoices({ calendar: 'rumi', year, month: null, day: null }).months.map((m) => m.name);
    expect(names(1324)).toEqual([
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
    expect(names(1333)).toEqual(names(1324).slice(0, 10));
  });

  it('offers the days the chosen month has', () => {
    const days = (calendar: 'gregorian' | 'hijri' | 'rumi', year: number, month: number) =>
      wheelChoices({ calendar, year, month, day: null }).days.at(-1);
    expect(days('gregorian', 1900, 2)).toBe(28);
    expect(days('gregorian', 2000, 2)).toBe(29);
    expect(days('hijri', 1327, 1)).toBe(30);
    expect(days('hijri', 1327, 2)).toBe(29);
    // 16 Şubat 1332 was 1 Mart 1333 (R5).
    expect(days('rumi', 1332, 2)).toBe(15);
  });

  it('keeps Gün shut until Ay is chosen', () => {
    expect(wheelChoices({ calendar: 'hijri', year: 1310, month: null, day: null }).dayOpen).toBe(false);
    expect(wheelChoices({ calendar: 'hijri', year: 1310, month: 3, day: null }).dayOpen).toBe(true);
  });

  it('skips the Rumî years that were never numbered', () => {
    const { years } = wheelChoices({ calendar: 'rumi', year: 1300, month: null, day: null });
    expect(years[0]).toBe(1200);
    expect(years.at(-1)).toBe(1341);
    expect(years).toContain(1220);
    expect(years).not.toContain(1221);
    expect(years).toContain(1254);
    expect(years).not.toContain(1255);
  });

  it('stops at the latest year it is given, for Erişim tarihi', () => {
    const { years } = wheelChoices({ calendar: 'gregorian', year: 2026, month: 10, day: 31 }, { latestYear: 2026 });
    expect(years.at(-1)).toBe(2026);
  });

  it('still offers a year outside its span when the Date already has it', () => {
    const { years } = wheelChoices({ calendar: 'gregorian', year: 850, month: null, day: null });
    expect(years[0]).toBe(850);
  });
});

describe('turnWheels', () => {
  it('clears Ay and Gün and keeps Yıl when the calendar changes', () => {
    expect(turnWheels({ calendar: 'gregorian', year: 1327, month: 3, day: 2 }, { calendar: 'hijri' })).toEqual({
      calendar: 'hijri',
      year: 1327,
      month: null,
      day: null,
    });
  });

  it('moves Yıl to about 1900 when the new calendar has no such year', () => {
    expect(turnWheels({ calendar: 'gregorian', year: 1909, month: null, day: null }, { calendar: 'rumi' })).toEqual({
      calendar: 'rumi',
      year: 1316,
      month: null,
      day: null,
    });
  });

  it('brings Gün back to the last day of a shorter month', () => {
    expect(turnWheels({ calendar: 'gregorian', year: 1909, month: 1, day: 31 }, { month: 2 })).toEqual({
      calendar: 'gregorian',
      year: 1909,
      month: 2,
      day: 28,
    });
  });

  it('clears Gün when Ay goes back to —', () => {
    expect(turnWheels({ calendar: 'hijri', year: 1327, month: 3, day: 2 }, { month: null }).day).toBeNull();
  });

  it('clears Ay and Gün when the new year lacks the month', () => {
    // Rumî 1333 ended with Kânunuevvel; 1334 began with Kânunusani.
    expect(turnWheels({ calendar: 'rumi', year: 1334, month: 1, day: 5 }, { year: 1333 })).toEqual({
      calendar: 'rumi',
      year: 1333,
      month: null,
      day: null,
    });
  });
});

describe('dateWheels and wheelsDate', () => {
  it('put a Date on the wheels and read it back', () => {
    const date = { calendar: 'hijri' as const, year: 1327, month: 3, day: 2 };
    expect(wheelsDate(dateWheels(date))).toEqual(date);
    expect(wheelsDate(dateWheels({ calendar: 'rumi', year: 1310 }))).toEqual({ calendar: 'rumi', year: 1310 });
  });

  it('start an empty field on Milâdî 1900 with Ay and Gün on —', () => {
    expect(dateWheels(null)).toEqual({ calendar: 'gregorian', year: 1900, month: null, day: null });
  });
});
