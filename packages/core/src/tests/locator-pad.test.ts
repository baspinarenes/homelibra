import { describe, expect, it } from 'vitest';

import { type LocatorPad, locatorErase, locatorPad, pressLocatorKey } from '../note';

describe('locatorPad', () => {
  it('gives the page pad to the Source types cited by page', () => {
    for (const type of ['book', 'article', 'thesis'] as const) {
      expect(locatorPad(type)).toEqual({
        prefix: 's. ',
        keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '–', '0'],
      });
    }
  });

  it('gives the folio pad, with recto and verso, to a Manuscript', () => {
    expect(locatorPad('manuscript')).toEqual({
      prefix: 'vr. ',
      keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', '0', 'b', '–'],
    });
  });

  it('gives the time pad to a Recording', () => {
    expect(locatorPad('recording')).toEqual({
      prefix: '',
      keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', ':', '0'],
    });
  });

  it('leaves the other types to free text', () => {
    for (const type of ['archive', 'periodical', 'webPage', 'other'] as const) {
      expect(locatorPad(type)).toBeNull();
    }
  });
});

describe('pressLocatorKey', () => {
  const page = locatorPad('book')!;
  const typed = (pad: LocatorPad, keys: string[], from = '') =>
    keys.reduce((locator, key) => pressLocatorKey(pad, locator, key), from);

  it('puts the prefix in front of the first key', () => {
    expect(typed(page, ['4', '5'])).toBe('s. 45');
    expect(typed(locatorPad('manuscript')!, ['1', '2', 'b'])).toBe('vr. 12b');
  });

  it('writes a range after the dash', () => {
    expect(typed(page, ['4', '5', '–', '4', '7'])).toBe('s. 45–47');
  });

  it('has no prefix for time', () => {
    expect(typed(locatorPad('recording')!, ['1', '2', ':', '3', '4'])).toBe('12:34');
  });

  it('erases the last character, and the prefix with the last digit', () => {
    expect(typed(page, [locatorErase], 's. 45')).toBe('s. 4');
    expect(typed(page, [locatorErase], 's. 4')).toBe('');
    expect(typed(page, [locatorErase], '')).toBe('');
  });

  it('carries on from a Locator written some other way', () => {
    expect(typed(page, ['2'], 's. xii, dn. ')).toBe('s. xii, dn. 2');
  });
});
