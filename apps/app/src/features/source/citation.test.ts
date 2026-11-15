import { describe, expect, it } from 'vitest';

import { citation, type CitedSource } from './citation';

const book: CitedSource = {
  type: 'book',
  author: 'Selim Uğurlu',
  date: { calendar: 'gregorian', year: 2014 },
  isbn: '9789753333333',
  doi: null,
  bibliographicNote: 'çev. A. Yılmaz',
  fields: { publisher: 'Tarih Vakfı Yurt Yayınları, İstanbul', edition: '2. baskı' },
};

describe('citation', () => {
  it('puts Yazar, Tarih and the fields the type shows open on the one line', () => {
    expect(citation(book).line).toEqual(['Selim Uğurlu', '2014', 'Tarih Vakfı Yurt Yayınları, İstanbul']);
  });

  it('lists every filled field the type shows in the full künye, in the form order', () => {
    expect(citation(book).rows).toEqual([
      { key: 'author', value: 'Selim Uğurlu' },
      { key: 'date', value: '2014' },
      { key: 'isbn', value: '9789753333333' },
      { key: 'publisher', value: 'Tarih Vakfı Yurt Yayınları, İstanbul' },
      { key: 'edition', value: '2. baskı' },
      { key: 'bibliographicNote', value: 'çev. A. Yılmaz' },
    ]);
    expect(citation(book).more).toBe(true);
  });

  it('leaves out what is blank, and the fields the type hides though they are kept', () => {
    const article: CitedSource = {
      type: 'article',
      author: '  ',
      date: null,
      isbn: '9789753333333',
      doi: null,
      bibliographicNote: null,
      fields: { container: 'Toplumsal Tarih', pageRange: '', publisher: 'kept from a book' },
    };
    expect(citation(article).rows).toEqual([{ key: 'container', value: 'Toplumsal Tarih' }]);
  });

  it('has nothing more to open when the one line already says it all', () => {
    expect(citation({ ...book, isbn: null, bibliographicNote: null, fields: { publisher: 'Metis' } }).more).toBe(false);
  });

  it('writes a date field as it was entered', () => {
    const page: CitedSource = {
      type: 'webPage',
      author: null,
      date: null,
      isbn: null,
      doi: null,
      bibliographicNote: null,
      fields: { siteName: 'Dergipark', accessDate: { calendar: 'gregorian', year: 2024, month: 3, day: 9 } },
    };
    expect(citation(page).line).toEqual(['Dergipark', '9 Mart 2024']);
  });
});
