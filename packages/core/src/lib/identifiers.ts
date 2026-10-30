/** What a scholar may paste in front of a DOI: its resolver URL or the `doi:` scheme. */
const doiPrefix = /^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i;

/**
 * The DOI a scholar typed or pasted, as the lookup cache keys it: without a
 * resolver prefix and lower-cased, since DOIs ignore case. Null when it is
 * not a DOI (10.<registrant>/<suffix>).
 */
export function normalizeDoi(text: string): string | null {
  const doi = text.trim().replace(doiPrefix, '');
  // eslint-disable-next-line no-restricted-syntax -- DOI case folding is ASCII-only, not Turkish
  return /^10\.\d{4,9}\/\S+$/.test(doi) ? doi.toLowerCase() : null;
}

/** What a scholar may write around an ISBN: the word itself, a "-13"/"-10", a colon, hyphens and spaces. */
const isbnNoise = /^\s*isbn(?:-1[03])?:?|[\s-]/gi;

/** The ISBN-13 check digit of its first twelve digits. */
function isbn13Check(twelve: string) {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(twelve[i]) * (i % 2 === 0 ? 1 : 3);
  return String((10 - (sum % 10)) % 10);
}

/** Whether an ISBN-10's digits (the last may be X for ten) add up as its check digit says. */
function isbn10Valid(isbn: string) {
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += (isbn[i] === 'X' || isbn[i] === 'x' ? 10 : Number(isbn[i])) * (10 - i);
  return sum % 11 === 0;
}

/**
 * The ISBN a scholar typed, as the lookup cache keys it: the ISBN-13, an
 * ISBN-10 turned into its 978 form. Null when it is not an ISBN or its check
 * digit is wrong, a typing slip a provider would answer with another book.
 */
export function normalizeIsbn(text: string): string | null {
  const isbn = text.replace(isbnNoise, '');
  if (/^97[89]\d{10}$/.test(isbn)) return isbn13Check(isbn) === isbn[12] ? isbn : null;
  if (/^\d{9}[\dXx]$/.test(isbn) && isbn10Valid(isbn)) {
    const twelve = `978${isbn.slice(0, 9)}`;
    return twelve + isbn13Check(twelve);
  }
  return null;
}
