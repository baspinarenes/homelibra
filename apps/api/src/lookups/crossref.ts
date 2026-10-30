import type { CalendarDate } from '@homelibra/core/date';
import type { SourceTextField } from '@homelibra/core/source';

import { contactEmail } from '../contact';

/**
 * The edge where DOI lookups leave the system; tests swap in a fake.
 * Only the DOI goes out, from our server, so Crossref learns nothing about
 * the scholar who asked.
 */
export interface Crossref {
  /** The work Crossref holds for a normalised DOI, exactly as it came; null when it has none. */
  work(doi: string): Promise<unknown>;
}

/**
 * Crossref's REST API, in its "polite" pool: no key, but a mailto that names
 * us (docs/research/turkish-metadata-lookup.md).
 */
export function crossrefClient(): Crossref {
  return {
    async work(doi) {
      const url = new URL(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
      url.searchParams.set('mailto', contactEmail);
      const response = await fetch(url, {
        headers: { 'user-agent': `Homelibra (https://homelibra.app; mailto:${contactEmail})` },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Crossref: ${response.status} for ${doi}`);
      const body = (await response.json()) as { message?: unknown };
      return body.message ?? null;
    },
  };
}

/** The part of a Crossref work the Article form uses. */
type CrossrefWork = {
  title?: string[];
  subtitle?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  'container-title'?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  issued?: { 'date-parts'?: (number | null)[][] };
};

/** What DOI ile doldur puts into the Article form; whatever Crossref left out is left out here too. */
export type DoiFill = {
  doi: string;
  title?: string;
  author?: string;
  date?: CalendarDate;
  fields: Partial<Record<Extract<SourceTextField, 'container' | 'volumeIssue' | 'pageRange'>, string>>;
};

const authors = new Intl.ListFormat('tr', { type: 'conjunction' });

/** Crossref titles may carry JATS markup (<i>, <sub>) and doubled spaces. */
function clean(text: string | undefined) {
  const cleaned = text
    ?.replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || undefined;
}

/**
 * Reads a cached Crossref work into the form's fields, each time it is
 * asked, so a better reading applies to every work already cached. Tarih is
 * the year of issue, Milâdî. İÜ journals put a "0" placeholder in volume;
 * an issue without a volume is written "S. 89" so it does not read as Cilt.
 */
export function fillFromCrossref(doi: string, raw: unknown): DoiFill {
  const work = raw as CrossrefWork;
  const title = clean(work.title?.[0]);
  const subtitle = clean(work.subtitle?.[0]);
  const names = (work.author ?? [])
    .map((a) => clean([a.given, a.family].filter(Boolean).join(' ')) ?? clean(a.name))
    .filter((name) => name !== undefined);
  const volume = work.volume === '0' ? undefined : clean(work.volume);
  const issue = clean(work.issue);
  const year = work.issued?.['date-parts']?.[0]?.[0];

  const fill: DoiFill = { doi, fields: {} };
  if (title) fill.title = subtitle ? `${title}: ${subtitle}` : title;
  if (names.length > 0) fill.author = authors.format(names);
  if (typeof year === 'number') fill.date = { calendar: 'gregorian', year };
  const container = clean(work['container-title']?.[0]);
  if (container) fill.fields.container = container;
  if (volume) fill.fields.volumeIssue = issue ? `${volume}/${issue}` : volume;
  else if (issue) fill.fields.volumeIssue = `S. ${issue}`;
  const pageRange = clean(work.page);
  if (pageRange) fill.fields.pageRange = pageRange;
  return fill;
}
