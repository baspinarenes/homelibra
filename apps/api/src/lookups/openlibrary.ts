import type { CalendarDate } from '@homelibra/core/date';
import type { SourceTextField } from '@homelibra/core/source';

import { contactEmail } from '../contact';

/**
 * The edge where ISBN lookups leave the system; tests swap in a fake. Only
 * the ISBN goes out, from our server, so Open Library learns nothing about
 * the scholar who asked.
 */
export interface OpenLibrary {
  /** The edition Open Library holds for an ISBN-13 (Books API, jscmd=data), exactly as it came; null when it has none. */
  book(isbn: string): Promise<unknown>;
  /** The edition's cover picture as Open Library keeps it, in whatever image format; null when it has none. */
  cover(isbn: string): Promise<Uint8Array | null>;
}

/** Open Library asks for a User-Agent that names the app and a contact, and allows it more requests. */
const headers = { 'user-agent': `Homelibra (https://homelibra.com; ${contactEmail})` };

/**
 * Open Library's Books and Covers APIs: no key (docs/research/turkish-metadata-lookup.md).
 * Covers by ISBN are limited to 100 requests per IP in five minutes; the
 * shared cache keeps us far under it.
 */
export function openLibraryClient(): OpenLibrary {
  return {
    async book(isbn) {
      const url = new URL('https://openlibrary.org/api/books');
      url.searchParams.set('bibkeys', `ISBN:${isbn}`);
      url.searchParams.set('jscmd', 'data');
      url.searchParams.set('format', 'json');
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Open Library: ${response.status} for ${isbn}`);
      const body = (await response.json()) as Record<string, unknown>;
      return body[`ISBN:${isbn}`] ?? null;
    },

    async cover(isbn) {
      // Without default=false a missing cover comes back as a blank picture.
      const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Open Library covers: ${response.status} for ${isbn}`);
      return new Uint8Array(await response.arrayBuffer());
    },
  };
}

/** The part of an Open Library edition the Book form uses. */
type OpenLibraryEdition = {
  title?: string;
  subtitle?: string;
  authors?: { name?: string }[];
  publishers?: { name?: string }[];
  publish_places?: { name?: string }[];
  publish_date?: string;
};

/** What ISBN ile öner offers for the Book form; whatever Open Library left out is left out here too. */
export type IsbnFields = {
  isbn: string;
  title?: string;
  author?: string;
  date?: CalendarDate;
  fields: Partial<Record<Extract<SourceTextField, 'publisher' | 'placeOfPublication'>, string>>;
};

const authors = new Intl.ListFormat('tr', { type: 'conjunction' });

function clean(text: string | undefined) {
  const cleaned = text?.replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

/**
 * Reads a cached Open Library edition into the Book form's fields, each
 * time it is asked, so a better reading applies to every edition already
 * cached. Open Library's spelling is kept as it came (it is only offered);
 * Tarih is the year in its date ("Nov 01, 2018" or "2018"), Milâdî.
 */
export function fieldsFromOpenLibrary(isbn: string, raw: unknown): IsbnFields {
  const edition = raw as OpenLibraryEdition;
  const title = clean(edition.title);
  const subtitle = clean(edition.subtitle);
  const names = (edition.authors ?? []).map((a) => clean(a.name)).filter((name) => name !== undefined);
  const year = edition.publish_date?.match(/\b(\d{4})\b/)?.[1];

  const suggestion: IsbnFields = { isbn, fields: {} };
  if (title) suggestion.title = subtitle ? `${title}: ${subtitle}` : title;
  if (names.length > 0) suggestion.author = authors.format(names);
  if (year) suggestion.date = { calendar: 'gregorian', year: Number(year) };
  const publisher = clean(edition.publishers?.[0]?.name);
  if (publisher) suggestion.fields.publisher = publisher;
  const place = clean(edition.publish_places?.[0]?.name);
  if (place) suggestion.fields.placeOfPublication = place;
  return suggestion;
}
