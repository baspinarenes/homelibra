import { describe, expect, it } from 'vitest';

import { type CalendarDate, inYearRange, yearRange } from '../date';

const miladi = (year: number, month?: number, day?: number): CalendarDate => ({
  calendar: 'gregorian',
  year,
  ...(month && { month }),
  ...(day && { day }),
});

// The Tarih filter of Kaynaklar and Ara (#40, story 164): Başlangıç and Bitiş
// years, each in its own calendar, compared by the first Milâdî day of a
// Source's Date (ADR-0002).
describe('inYearRange', () => {
  it.each<[string, CalendarDate, boolean]>([
    ['1 Ocak 1908', miladi(1908, 1, 1), true],
    ['1908', miladi(1908), true],
    ['31 Aralık 1914', miladi(1914, 12, 31), true],
    ['1914', miladi(1914), true],
    ['31 Aralık 1907', miladi(1907, 12, 31), false],
    ['1 Ocak 1915', miladi(1915, 1, 1), false],
    ['1326 h. (from 4 Şubat 1908)', { calendar: 'hijri', year: 1326 }, true],
    ['Mart 1324 r.', { calendar: 'rumi', year: 1324, month: 3 }, true],
  ])('Milâdî 1908–1914 keeps %s: %s', (_, date, kept) => {
    const range = { from: { calendar: 'gregorian', year: 1908 }, to: { calendar: 'gregorian', year: 1914 } } as const;
    expect(inYearRange(date, range)).toBe(kept);
  });

  it.each<[string, CalendarDate, boolean]>([
    ['1908 (its first day is before 1 M 1326)', miladi(1908), false],
    ['3 Şubat 1908', miladi(1908, 2, 3), false],
    ['4 Şubat 1908 (1 M 1326)', miladi(1908, 2, 4), true],
    ['29 Z 1332', { calendar: 'hijri', year: 1332, month: 12, day: 29 }, true],
    ['1 M 1333', { calendar: 'hijri', year: 1333, month: 1, day: 1 }, false],
  ])('Hicrî 1326–1332 keeps %s: %s', (_, date, kept) => {
    const range = { from: { calendar: 'hijri', year: 1326 }, to: { calendar: 'hijri', year: 1332 } } as const;
    expect(inYearRange(date, range)).toBe(kept);
  });

  it.each<[string, CalendarDate, boolean]>([
    ['13 Mart 1908 (29 Şubat 1323 r.)', miladi(1908, 3, 13), false],
    ['14 Mart 1908 (1 Mart 1324 r.)', miladi(1908, 3, 14), true],
    ['Şubat 1330 r. (Mart 1915)', { calendar: 'rumi', year: 1330, month: 2 }, true],
    ['1331 r.', { calendar: 'rumi', year: 1331 }, false],
  ])('Rumî 1324–1330 keeps %s: %s', (_, date, kept) => {
    const range = { from: { calendar: 'rumi', year: 1324 }, to: { calendar: 'rumi', year: 1330 } } as const;
    expect(inYearRange(date, range)).toBe(kept);
  });

  it('hides a Source without a Date while a year is set, and keeps it when none is', () => {
    expect(inYearRange(null, { from: { calendar: 'gregorian', year: 1908 } })).toBe(false);
    expect(inYearRange(null, { to: { calendar: 'gregorian', year: 1914 } })).toBe(false);
    expect(inYearRange(null, {})).toBe(true);
  });

  it('leaves a side without a year open', () => {
    expect(inYearRange(miladi(1500), { to: { calendar: 'gregorian', year: 1914 } })).toBe(true);
    expect(inYearRange(miladi(2020), { from: { calendar: 'hijri', year: 1326 } })).toBe(true);
  });
});

describe('yearRange', () => {
  it.each([
    ['Milâdî 1908–1914', { calendar: 'gregorian', year: 1908 }, { calendar: 'gregorian', year: 1914 }, 1908, 1914],
    ['Hicrî 1326–1332', { calendar: 'hijri', year: 1326 }, { calendar: 'hijri', year: 1332 }, 1908, 1914],
    ['Rumî 1324–1330', { calendar: 'rumi', year: 1324 }, { calendar: 'rumi', year: 1330 }, 1908, 1915],
    ['Rumî 1324 – Milâdî 1914', { calendar: 'rumi', year: 1324 }, { calendar: 'gregorian', year: 1914 }, 1908, 1914],
  ] as const)('gives the Milâdî years of %s for the hint', (_, from, to, first, last) => {
    expect(yearRange({ from, to })?.gregorian).toEqual({ from: first, to: last });
  });

  it('gives null for an open side and no range for no year', () => {
    expect(yearRange({ from: { calendar: 'hijri', year: 1326 } })?.gregorian).toEqual({ from: 1908, to: null });
    expect(yearRange({})).toEqual({ min: null, max: null, gregorian: { from: null, to: null } });
  });

  it('is null when a year does not exist in its calendar', () => {
    expect(yearRange({ from: { calendar: 'rumi', year: 1400 } })).toBeNull();
    expect(yearRange({ to: { calendar: 'rumi', year: 1255 } })).toBeNull();
  });
});
