import { describe, expect, it } from 'vitest';

import { keptHidden, sourceLayout } from '../source';

// The Sade form's table from the Source form prototype (#18).
describe('sourceLayout', () => {
  it.each([
    ['book', 'isbn', ['publisher', 'placeOfPublication'], ['edition', 'firstEditionDate']],
    ['article', 'doi', ['container', 'volumeIssue', 'pageRange'], []],
    ['thesis', null, ['university', 'thesisType'], []],
    ['archive', null, [], []],
    ['manuscript', null, ['library', 'shelfmark'], []],
    ['periodical', null, ['placeOfPublication'], []],
    ['recording', null, ['url'], ['series', 'duration']],
    ['webPage', null, ['url', 'siteName', 'accessDate'], []],
    ['other', null, [], []],
  ] as const)('%s: identifier %s, open %j, behind the button %j', (type, identifier, open, tucked) => {
    expect(sourceLayout(type)).toEqual({ identifier, open, tucked });
  });
});

describe('keptHidden', () => {
  const book = { isbn: '978-975-05-0000-0', publisher: 'İletişim', edition: '3. baskı', placeOfPublication: '' };

  it('lists the filled values a new type does not show', () => {
    expect(keptHidden('article', { ...book, container: 'Belleten' })).toEqual(['isbn', 'publisher', 'edition']);
  });

  it('lists nothing once the old type is back', () => {
    expect(keptHidden('book', book)).toEqual([]);
  });

  it('counts a tucked field as shown', () => {
    expect(keptHidden('recording', { series: 'Tarih Sohbetleri', duration: '58:12' })).toEqual([]);
  });

  it('lists a Date field once it holds a Date', () => {
    const firstEditionDate = { calendar: 'gregorian', year: 1973 } as const;
    expect(keptHidden('article', { firstEditionDate })).toEqual(['firstEditionDate']);
    expect(keptHidden('book', { firstEditionDate })).toEqual([]);
  });

  it('ignores blank values', () => {
    expect(keptHidden('archive', { publisher: '  ', doi: '' })).toEqual([]);
  });
});
