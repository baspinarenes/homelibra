import { describe, expect, it } from 'vitest';

import { tagIdentity, tagName, tagSuggestKey } from '../tag';

// The examples are #3's: "ittihat ve terakki" and "İttihat ve Terakki" are one
// Tag; "âlem" / "alem" and "kır" / "kir" are two.

describe('tagIdentity', () => {
  it.each([
    ['ittihat ve terakki', 'İttihat ve Terakki'],
    ['IRAK', 'ırak'],
    ['İstanbul', 'istanbul'],
    ['  Enver   Paşa ', 'Enver Paşa'],
    ['#basın', 'basın'],
    ['# Selanik', 'Selanik'],
  ])('makes %j and %j one Tag', (a, b) => {
    expect(tagIdentity(a)).toBe(tagIdentity(b));
  });

  it.each([
    ['âlem', 'alem'],
    ['kır', 'kir'],
    ['Istanbul', 'İstanbul'],
    ['Hilâfet', 'Hilafet'],
    ['Ahmed Cevdet', 'Ahmed-Cevdet'],
    ["kadı'nın", 'kadının'],
  ])('keeps %j and %j two Tags', (a, b) => {
    expect(tagIdentity(a)).not.toBe(tagIdentity(b));
  });

  it('lowers by Turkish rules: I pairs with ı, İ with i', () => {
    expect(tagIdentity('IRAK')).toBe('ırak');
    expect(tagIdentity('İZMİR')).toBe('izmir');
  });
});

describe('tagName', () => {
  it('keeps the spelling as entered, without the leading # and the extra spaces', () => {
    expect(tagName('  #İttihat   ve Terakki ')).toBe('İttihat ve Terakki');
    expect(tagName('Hilâfet')).toBe('Hilâfet');
  });

  it('is empty when nothing but a # and spaces was written', () => {
    expect(tagName(' # ')).toBe('');
  });
});

describe('tagSuggestKey', () => {
  it.each([
    ['hilafet', 'Hilâfet'],
    ['Istanbul', 'İstanbul'],
    ['kir', 'kır'],
    ['alem', 'âlem'],
    ['ittihat-i muhammedi', 'İttihat-ı Muhammedî'],
    ['ulema', 'ʿulemâ'],
  ])('folds %j and %j together', (typed, tag) => {
    expect(tagSuggestKey(typed)).toBe(tagSuggestKey(tag));
  });

  it('lets a few letters find a longer Tag', () => {
    expect(tagSuggestKey('Hilâfet ve Saltanat')).toContain(tagSuggestKey('hilaf'));
  });
});
