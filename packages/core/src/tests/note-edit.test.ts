import { describe, expect, it } from 'vitest';

import { capturedNote, editedNote, rederivedSort } from '../note';

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

  it('derives the sort value from the Locator on every edit, one that leaves the Locator as it was too', () => {
    // Stored before the Sort value was only ever derived, or under an older rule.
    const stale = { ...irade, locatorSort: [1234, 56, 29, 1310] };

    expect(editedNote(stale, { comment: 'Tarih önce yazılmış.' })?.locatorSort).toEqual([29, 1310, 1234, 56]);
    expect(editedNote(stale, { locator: ' 29 Z 1310, 1234/56 ' })?.locatorSort).toEqual([29, 1310, 1234, 56]);
  });

  it('gives a Note without a Locator no sort value, whatever it had', () => {
    expect(editedNote(irade, { locator: ' ' })).toMatchObject({ locator: null, locatorSort: null });
  });
});

describe('rederivedSort', () => {
  it('reads a stored sort value from the Locator again', () => {
    // Stored under an older rule, or corrected by hand before #125.
    expect(rederivedSort({ locator: irade.locator, locatorSort: [1234, 56, 29, 1310] })).toEqual({
      locatorSort: [29, 1310, 1234, 56],
    });
    expect(rederivedSort({ locator: irade.locator, locatorSort: [29, 1310, 1234] })).toEqual({
      locatorSort: [29, 1310, 1234, 56],
    });
  });

  it('takes away a sort value its Locator does not give', () => {
    expect(rederivedSort({ locator: 'Önsöz', locatorSort: [3] })).toEqual({ locatorSort: null });
    expect(rederivedSort({ locator: null, locatorSort: [3] })).toEqual({ locatorSort: null });
    expect(rederivedSort({ locator: 's. 45', locatorSort: null })).toEqual({ locatorSort: [45] });
  });

  it('leaves a value that is right already', () => {
    expect(rederivedSort(irade)).toBeNull();
    expect(rederivedSort({ locator: 'Önsöz', locatorSort: null })).toBeNull();
  });
});
