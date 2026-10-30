import { normalizeDoi } from '@homelibra/core/source';
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

/**
 * Lookups the Source form makes. They go through the API only, never from
 * the app to a provider, so the cache is shared by every Library.
 */
export const lookupsRouter = router({
  /** DOI ile doldur: the Article fields Crossref gives, or null for "bulunamadı". */
  doi: scholarProcedure.input(z.object({ doi })).query(({ ctx, input }) => ctx.lookups.doi(input.doi)),
});
