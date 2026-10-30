import { describe, expect, it } from 'vitest';

import { compareNotes, formatSortValue, locatorSortValue } from '../note';

describe('locatorSortValue', () => {
  // The scenario table of #2 (Source türleri ve Locator biçimleri, §6).
  it.each([
    ['vr. 12b', [12.5]],
    ['vr. 12b-13a', [12.5, 13]],
    ['s. 30', [30]],
    ['s. 45', [45]],
    ['s. 45, dn. 12', [45, 12]],
    ['ss. 45-47', [45, 47]],
    ['12:34', [754]],
    ['nr. 1134, s. 2 (12 Kânunusani 1327)', [1134, 2, 12, 1327]],
    ['1234/56', [1234, 56]],
    ['1234/56, lef 3', [1234, 56, 3]],
    ['1234/56 (29 Z 1310)', [1234, 56, 29, 1310]],
    ['30-18-1-2 / 12-34-5', [30, 18, 1, 2, 12, 34, 5]],
    ['1:23:45', [5025]],
    ['s. 12, 45', [12, 45]],
  ])('%s sorts as %j', (locator, value) => {
    expect(locatorSortValue(locator)).toEqual(value);
  });

  it.each(['Önsöz', 'xii', 'Giriş, xii'])('%s has no sort value: it holds no number', (locator) => {
    expect(locatorSortValue(locator)).toBeNull();
  });

  it('ignores Roman numerals beside the numbers', () => {
    expect(locatorSortValue('c. II, s. 45')).toEqual([45]);
  });

  it('reads a b only as a folio side, not as the start of a word', () => {
    expect(locatorSortValue('12 bis')).toEqual([12]);
    expect(locatorSortValue('12bis')).toEqual([12]);
  });
});

describe('compareNotes', () => {
  // Ids are UUIDv7, so their order is capture order (ADR-0008): 01 was captured first.
  const note = (id: string, locator: string | null) => ({
    id,
    locator,
    locatorSort: locator === null ? null : locatorSortValue(locator),
  });
  const ordered = (notes: ReturnType<typeof note>[]) => [...notes].sort(compareNotes).map((n) => n.locator);

  it('puts Notes without a Locator first, then unsortable Locators, then the rest by sort value', () => {
    const notes = [
      note('01', 'ss. 45-47'),
      note('02', 'Önsöz'),
      note('03', 's. 45, dn. 12'),
      note('04', null),
      note('05', 'vr. 12b'),
      note('06', 's. 45'),
      note('07', 'xii'),
      note('08', 's. 30'),
      note('09', null),
    ];

    expect(ordered(notes)).toEqual([
      null,
      null,
      'Önsöz',
      'xii',
      'vr. 12b',
      's. 30',
      's. 45',
      's. 45, dn. 12',
      'ss. 45-47',
    ]);
  });

  it('keeps capture order among Notes without a Locator and among unsortable ones', () => {
    const notes = [note('04', 'xii'), note('03', null), note('02', 'Önsöz'), note('01', null)];

    expect([...notes].sort(compareNotes).map((n) => n.id)).toEqual(['01', '03', '02', '04']);
  });

  it('orders Notes with the same sort value oldest first', () => {
    const notes = [note('03', 's. 45'), note('01', 'S. 45'), note('02', 'p. 45')];

    expect([...notes].sort(compareNotes).map((n) => n.id)).toEqual(['01', '02', '03']);
  });

  it('sorts by the stored sort value, a corrected one too, not by the Locator text', () => {
    const corrected = { id: '01', locator: '29 Z 1310, 1234/56', locatorSort: [1234, 56, 29, 1310] };
    const notes = [corrected, note('02', '1234/55'), note('03', '1234/57')];

    expect([...notes].sort(compareNotes).map((n) => n.id)).toEqual(['02', '01', '03']);
  });
});

describe('formatSortValue', () => {
  it('writes the numbers apart, a folio side as b, a time in seconds', () => {
    expect(formatSortValue([12.5, 13])).toBe('12b · 13');
    expect(formatSortValue([1234, 56, 29, 1310])).toBe('1234 · 56 · 29 · 1310');
    expect(formatSortValue([5025])).toBe('5025');
  });

  it('reads back as the same value, so a corrected value is typed like a Locator', () => {
    for (const value of [[12.5, 13], [45, 12], [1234, 56, 29, 1310], [754]]) {
      expect(locatorSortValue(formatSortValue(value))).toEqual(value);
    }
  });
});
