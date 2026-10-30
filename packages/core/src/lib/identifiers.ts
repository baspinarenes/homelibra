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
