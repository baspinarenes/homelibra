import { describe, expect, it } from 'vitest';

import { draftChanged, emptyDraft, type SourceDraft } from './source-draft';

const stored: SourceDraft = {
  ...emptyDraft,
  title: 'Hamidiye Basını ve Sansür',
  author: 'Ayşe Demirtaş',
  date: { calendar: 'gregorian', day: '', month: null, year: '2011' },
  values: { isbn: '9789750000000', doi: '', publisher: 'Kitap Yayınevi' },
};

describe('draftChanged', () => {
  it('a form as it was opened holds nothing to lose', () => {
    expect(draftChanged(emptyDraft, emptyDraft)).toBe(false);
    expect(draftChanged(stored, { ...stored })).toBe(false);
  });

  it('a field written in is a change', () => {
    expect(draftChanged(emptyDraft, { ...emptyDraft, title: 'Tanin' })).toBe(true);
    expect(draftChanged(stored, { ...stored, values: { ...stored.values, publisher: 'İletişim' } })).toBe(true);
  });

  it('a field written in and erased again is no change', () => {
    expect(draftChanged(emptyDraft, { ...emptyDraft, values: { isbn: '' } })).toBe(false);
    expect(draftChanged(emptyDraft, { ...emptyDraft, title: '   ' })).toBe(false);
  });

  it('another Tür alone is a change', () => {
    expect(draftChanged(emptyDraft, { ...emptyDraft, type: 'article' })).toBe(true);
  });

  it('a Date half written is a change, though it is no Date yet', () => {
    const halfWritten = { ...emptyDraft, date: { calendar: 'gregorian', day: '12', month: 3, year: '' } } as const;
    expect(draftChanged(emptyDraft, halfWritten)).toBe(true);
  });

  it('a hidden field keeps its change after the Tür hides it', () => {
    const written = { ...stored, values: { ...stored.values, publisher: 'İletişim' } };
    expect(draftChanged(stored, { ...written, type: 'archive' })).toBe(true);
  });

  it("Open Library's cover accepted is a change, dropped again is none", () => {
    const cover = { isbn: '9789750000000', cover: { small: 's.jpg', large: 'l.jpg' } };
    expect(draftChanged(emptyDraft, { ...emptyDraft, suggestedCover: cover })).toBe(true);
    expect(draftChanged(emptyDraft, { ...emptyDraft, suggestedCover: null })).toBe(false);
  });
});
