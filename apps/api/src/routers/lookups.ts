import { normalizeDoi, normalizeIsbn } from '@homelibra/core/source';
import { z } from 'zod';

import { router, scholarProcedure } from '../trpc/init';

/** A DOI as typed or pasted, normalised the way the lookup cache keys it. */
const doi = z.string().transform((text, ctx) => {
  const normalized = normalizeDoi(text);
  if (normalized === null) {
    ctx.addIssue({ code: 'custom', message: 'Not a DOI' });
    return z.NEVER;
  }
  return normalized;
});

/** An ISBN as typed, ISBN-10 or ISBN-13, as the ISBN-13 the lookup cache keys it by. */
export const isbn = z.string().transform((text, ctx) => {
  const normalized = normalizeIsbn(text);
  if (normalized === null) {
    ctx.addIssue({ code: 'custom', message: 'Not an ISBN' });
    return z.NEVER;
  }
  return normalized;
});

/**
 * Lookups the Source form makes. They go through the API only, never from
 * the app to a provider, so the cache is shared by every Library.
 */
export const lookupsRouter = router({
  /** DOI ile doldur: the Article fields Crossref gives, or null for "bulunamadı". */
  doi: scholarProcedure.input(z.object({ doi })).query(({ ctx, input }) => ctx.lookups.doi(input.doi)),

  /**
   * ISBN ile öner: the Book fields and cover Open Library gives, or null for
   * "bulunamadı". Only an offer: the app writes nothing until the scholar accepts it.
   */
  isbn: scholarProcedure.input(z.object({ isbn })).query(({ ctx, input }) => ctx.lookups.isbn(input.isbn)),
});
