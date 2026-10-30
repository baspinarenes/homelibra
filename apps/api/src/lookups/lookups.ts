import { and, eq, isNull } from 'drizzle-orm';

import type { Db } from '../db/client';
import { lookupCache } from '../db/schema';
import { type Crossref, type DoiFill, fillFromCrossref } from './crossref';

/** A "bulunamadı" is asked again after this long; a provider may add the work later. */
const MISS_MS = 7 * 24 * 60 * 60 * 1000;

type Kind = (typeof lookupCache.$inferSelect)['kind'];
type Provider = (typeof lookupCache.$inferSelect)['provider'];

/**
 * ISBN and DOI lookups through the shared cache (ADR-0006). A provider is
 * asked once per identifier for every Library: a hit is kept as it came and
 * never refreshed, a miss is kept for seven days. A provider that fails
 * leaves nothing behind, so the next call asks again.
 */
export function lookups(db: Db, providers: { crossref: Crossref }, now: () => Date) {
  async function cached(kind: Kind, identifier: string, provider: Provider, ask: () => Promise<unknown>) {
    const key = and(eq(lookupCache.kind, kind), eq(lookupCache.identifier, identifier));
    const [row] = await db.select().from(lookupCache).where(key);
    const fetchedAt = now();
    if (row && (row.response !== null || fetchedAt.getTime() - row.fetchedAt.getTime() < MISS_MS)) return row.response;

    const response = (await ask()) ?? null;
    // Only the provider's answer is stored, never anything a scholar typed.
    await db
      .insert(lookupCache)
      .values({ kind, identifier, provider, response, fetchedAt })
      .onConflictDoUpdate({
        target: [lookupCache.kind, lookupCache.identifier],
        set: { provider, response, fetchedAt },
        // A hit another request just stored is never replaced.
        setWhere: isNull(lookupCache.response),
      });
    return response;
  }

  return {
    /** DOI ile doldur: what Crossref knows of a normalised DOI, or null when it knows nothing. */
    async doi(doi: string): Promise<DoiFill | null> {
      const work = await cached('doi', doi, 'crossref', () => providers.crossref.work(doi));
      return work === null ? null : fillFromCrossref(doi, work);
    },
  };
}

export type Lookups = ReturnType<typeof lookups>;
