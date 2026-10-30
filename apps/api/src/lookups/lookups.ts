import * as Sentry from '@sentry/node';
import { and, eq, isNull } from 'drizzle-orm';

import { type Cover, coverFilesFrom, sharedCoverKeys } from '../covers/covers';
import type { Db } from '../db/client';
import { lookupCache } from '../db/schema';
import { type Crossref, type DoiFill, fillFromCrossref } from './crossref';
import { fieldsFromOpenLibrary, type IsbnFields, type OpenLibrary } from './openlibrary';
import type { ObjectStorage } from '../storage/object-storage';

/** A "bulunamadı" is asked again after this long; a provider may add the work later. */
const MISS_MS = 7 * 24 * 60 * 60 * 1000;

/** ISBN ile öner's offer: the Book form's fields and, when Open Library has one, its cover. */
export type IsbnSuggestion = IsbnFields & { cover: Cover | null };

type Kind = (typeof lookupCache.$inferSelect)['kind'];
type Provider = (typeof lookupCache.$inferSelect)['provider'];

/**
 * ISBN and DOI lookups through the shared cache (ADR-0006). A provider is
 * asked once per identifier for every Library: a hit is kept as it came and
 * never refreshed, a miss is kept for seven days. A provider that fails
 * leaves nothing behind, so the next call asks again. Open Library's covers
 * are kept the same way, their files resized under `isbn/` in the covers
 * bucket (ADR-0011).
 */
export function lookups(
  db: Db,
  providers: { crossref: Crossref; openLibrary: OpenLibrary },
  covers: ObjectStorage,
  now: () => Date,
) {
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

  /**
   * Open Library's cover of an ISBN-13, fetched once and resized into the
   * covers bucket. One it cannot give (down, or not a picture) is left out of
   * the offer and of the cache, so the next suggestion asks again.
   */
  async function isbnCover(isbn: string) {
    try {
      const keys = await cached('isbn_cover', isbn, 'openlibrary', async () => {
        const picture = await providers.openLibrary.cover(isbn);
        if (!picture) return null;
        const files = await coverFilesFrom(picture);
        const shared = sharedCoverKeys(isbn);
        await Promise.all([
          covers.put(shared.large, files.large, 'image/jpeg'),
          covers.put(shared.small, files.small, 'image/jpeg'),
        ]);
        return shared;
      });
      return keys as Cover | null;
    } catch (error) {
      Sentry.captureException(error);
      return null;
    }
  }

  /** ISBN ile öner: what Open Library knows of an ISBN-13, or null when it knows nothing. */
  async function isbn(isbn: string): Promise<IsbnSuggestion | null> {
    const edition = await cached('isbn', isbn, 'openlibrary', () => providers.openLibrary.book(isbn));
    if (edition === null) return null;
    return { ...fieldsFromOpenLibrary(isbn, edition), cover: await isbnCover(isbn) };
  }

  return {
    /** DOI ile doldur: what Crossref knows of a normalised DOI, or null when it knows nothing. */
    async doi(doi: string): Promise<DoiFill | null> {
      const work = await cached('doi', doi, 'crossref', () => providers.crossref.work(doi));
      return work === null ? null : fillFromCrossref(doi, work);
    },

    isbn,

    /**
     * The files of the cover ISBN ile öner offers for an ISBN-13, to copy into
     * a Library; null when there is none. A shared cover whose files the
     * bucket lost is forgotten, so the next suggestion fetches it again.
     */
    async isbnCoverFiles(isbn13: string): Promise<Record<keyof Cover, Uint8Array> | null> {
      const cover = (await isbn(isbn13))?.cover;
      if (!cover) return null;
      const [large, small] = await Promise.all([covers.get(cover.large), covers.get(cover.small)]);
      if (large && small) return { large, small };
      await db.delete(lookupCache).where(and(eq(lookupCache.kind, 'isbn_cover'), eq(lookupCache.identifier, isbn13)));
      return null;
    },
  };
}

export type Lookups = ReturnType<typeof lookups>;
