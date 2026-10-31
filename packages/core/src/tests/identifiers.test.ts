import { describe, expect, it } from 'vitest';

import { normalizeIsbn } from '../source';

// ISBNs of books in docs/research/turkish-metadata-lookup.md, written as scholars find them.
describe('normalizeIsbn', () => {
  it.each([
    ['9789750521188', '9789750521188'],
    ['978-975-05-2118-8', '9789750521188'],
    ['978 975 05 2118 8', '9789750521188'],
    ['ISBN 978-975-05-2118-8', '9789750521188'],
    ['ISBN-13: 9789750521188', '9789750521188'],
    [' 9786256774254 ', '9786256774254'],
    // ISBN-10s become the ISBN-13 the lookup cache keys them by.
    ['975-470-011-7', '9789754700114'],
    ['9754700117', '9789754700114'],
    ['0-19-853453-1', '9780198534532'],
    // An X check digit, either case.
    ['0-8044-2957-X', '9780804429573'],
    ['0-8044-2957-x', '9780804429573'],
  ])('reads %j as %s', (typed, isbn13) => {
    expect(normalizeIsbn(typed)).toBe(isbn13);
  });

  it.each([
    ['a wrong ISBN-13 check digit', '9789750521187'],
    ['a wrong ISBN-10 check digit', '975-470-011-1'],
    ['an X inside an ISBN-10', '97547X0117'],
    ['an ISBN-13 that is not a book number', '1234567890128'],
    ['too few digits', '978975052118'],
    ['too many digits', '97897505211888'],
    ['letters', 'Cereyanlar'],
    ['nothing', ''],
  ])('refuses %s', (_, typed) => {
    expect(normalizeIsbn(typed)).toBeNull();
  });
});
