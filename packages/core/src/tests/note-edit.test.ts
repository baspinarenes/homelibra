import { describe, expect, it } from 'vitest';

import { capturedNote, editedNote } from '../note';

const irade = { locator: '29 Z 1310, 1234/56', locatorSort: [29, 1310, 1234, 56], excerpt: 'İrade.', comment: null };

describe('capturedNote', () => {
  it('keeps the texts trimmed, a blank one empty, inner line breaks and all', () => {
    expect(capturedNote({ locator: ' ', excerpt: '  Birinci satır,\nikinci satır. \n', comment: '\t' })).toEqual({
      locator: null,
      locatorSort: null,
      excerpt: 'Birinci satır,\nikinci satır.',
      comment: null,
    });
  });

  it('needs an Excerpt or a Comment; a Locator alone is no Note', () => {
    expect(capturedNote({ locator: 's. 45' })).toBeNull();
    expect(capturedNote({ locator: 's. 45', excerpt: '  ', comment: '\n' })).toBeNull();
    expect(capturedNote({ comment: 'Genel değerlendirme.' })).toMatchObject({ locator: null, locatorSort: null });
  });

  it('derives the sort value from the Locator text, null when it holds no number', () => {
    expect(capturedNote({ locator: ' vr. 12b ', excerpt: 'Ferman.' })).toMatchObject({
      locator: 'vr. 12b',
      locatorSort: [12.5],
    });
    expect(capturedNote({ locator: 'Önsöz', excerpt: 'Giriş.' })).toMatchObject({ locatorSort: null });
  });
});

describe('editedNote', () => {
  it('changes only what the edit names, trimmed; blank or null empties it', () => {
    expect(editedNote(irade, { excerpt: ' İrade-i seniyye. ', comment: 'Tarih önce.' })).toEqual({
      ...irade,
      excerpt: 'İrade-i seniyye.',
      comment: 'Tarih önce.',
    });
    expect(editedNote({ ...irade, comment: 'Naip.' }, { excerpt: ' ' })).toMatchObject({ excerpt: null });
    expect(editedNote({ ...irade, comment: 'Naip.' }, { locator: null })).toMatchObject({
      locator: null,
      locatorSort: null,
    });
  });

  it('cannot leave a Note without an Excerpt or a Comment', () => {
    expect(editedNote(irade, { excerpt: '' })).toBeNull();
    expect(editedNote({ ...irade, comment: 'Naip.' }, { excerpt: null, comment: ' ' })).toBeNull();
  });

  it('keeps a corrected sort value until the Locator text changes, then derives it again', () => {
    const corrected = editedNote(irade, { locatorSort: [1234, 56, 29, 1310] })!;
    expect(corrected.locatorSort).toEqual([1234, 56, 29, 1310]);

    expect(editedNote(corrected, { comment: 'Tarih önce yazılmış.' })?.locatorSort).toEqual([1234, 56, 29, 1310]);
    // The same text, retyped with spaces around it, is no new Locator.
    expect(editedNote(corrected, { locator: ' 29 Z 1310, 1234/56 ' })?.locatorSort).toEqual([1234, 56, 29, 1310]);
    expect(editedNote(corrected, { locator: '29 Z 1310, 1234/57' })?.locatorSort).toEqual([29, 1310, 1234, 57]);
  });

  it('drops the correction for null, deriving the sort value again', () => {
    const corrected = { ...irade, locatorSort: [1234, 56, 29, 1310] };

    expect(editedNote(corrected, { locatorSort: null })?.locatorSort).toEqual([29, 1310, 1234, 56]);
  });

  it('takes a corrected sort value given with a new Locator, and derives it again when asked', () => {
    const onsoz = { locator: 'Önsöz', locatorSort: null, excerpt: null, comment: 'Giriş.' };

    const corrected = editedNote(onsoz, { locator: 'Önsöz, s. xii', locatorSort: [0, 12] })!;
    expect(corrected).toMatchObject({ locator: 'Önsöz, s. xii', locatorSort: [0, 12] });

    expect(editedNote(corrected, { locatorSort: null })?.locatorSort).toBeNull();
  });

  it('gives a Note without a Locator no sort value, corrected or not', () => {
    expect(editedNote(irade, { locator: ' ', locatorSort: [3] })).toMatchObject({ locator: null, locatorSort: null });
  });
});
