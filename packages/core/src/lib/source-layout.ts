import type { CalendarDate } from './calendar-date';

/** The nine fixed Source types (GLOSSARY.md, Source types). */
export const sourceTypes = [
  'book',
  'article',
  'thesis',
  'archive',
  'manuscript',
  'periodical',
  'recording',
  'webPage',
  'other',
] as const;

export type SourceType = (typeof sourceTypes)[number];

/** The type-specific fields. They live in one structured value, so a type change never drops one. */
export const sourceFields = [
  'publisher',
  'placeOfPublication',
  'edition',
  'container',
  'volumeIssue',
  'pageRange',
  'university',
  'thesisType',
  'library',
  'shelfmark',
  'url',
  'series',
  'duration',
  'siteName',
  'firstEditionDate',
  'accessDate',
] as const;

export type SourceField = (typeof sourceFields)[number];

/** The type-specific fields that hold a Date (ADR-0002) rather than text. */
export const sourceDateFields = ['firstEditionDate', 'accessDate'] as const satisfies readonly SourceField[];

export type SourceDateField = (typeof sourceDateFields)[number];

export type SourceTextField = Exclude<SourceField, SourceDateField>;

export function isSourceDateField(key: string): key is SourceDateField {
  return (sourceDateFields as readonly string[]).includes(key);
}

/** A Source's type-specific field values by key, the ones its type hides included. */
export type SourceFieldValues = Partial<Record<SourceTextField, string> & Record<SourceDateField, CalendarDate>>;

/** ISBN and DOI: entry points at the top of the form, stored apart from the other fields. */
export type SourceIdentifier = 'isbn' | 'doi';

export type SourceLayout = {
  /** Asked right under Tür, before Başlık. */
  identifier: SourceIdentifier | null;
  /** Shown after Yazar. */
  open: readonly SourceField[];
  /** Sparse fields, behind a button that names them. */
  tucked: readonly SourceField[];
};

const layouts: Record<SourceType, SourceLayout> = {
  book: { identifier: 'isbn', open: ['publisher', 'placeOfPublication'], tucked: ['edition', 'firstEditionDate'] },
  article: { identifier: 'doi', open: ['container', 'volumeIssue', 'pageRange'], tucked: [] },
  thesis: { identifier: null, open: ['university', 'thesisType'], tucked: [] },
  archive: { identifier: null, open: [], tucked: [] },
  manuscript: { identifier: null, open: ['library', 'shelfmark'], tucked: [] },
  periodical: { identifier: null, open: ['placeOfPublication'], tucked: [] },
  recording: { identifier: null, open: ['url'], tucked: ['series', 'duration'] },
  webPage: { identifier: null, open: ['url', 'siteName', 'accessDate'], tucked: [] },
  other: { identifier: null, open: [], tucked: [] },
};

/** Which fields the Source form shows for a type, in form order. */
export function sourceLayout(type: SourceType): SourceLayout {
  return layouts[type];
}

/** What the form holds besides Tür, Başlık, Yazar and Künye notu: ISBN, DOI and the field values. */
export type SourceValues = SourceFieldValues & Partial<Record<SourceIdentifier, string>>;

/** Whether a field holds something: text that is not blank, or a Date. */
export function isFilled(value: string | CalendarDate | null | undefined): boolean {
  return typeof value === 'string' ? value.trim() !== '' : value != null;
}

const formOrder = ['isbn', 'doi', ...sourceFields] as const satisfies readonly (SourceIdentifier | SourceField)[];

/**
 * The filled values that `type` does not show. A type change hides them and
 * never deletes them; the form names them under "Bu türde gizli ama korunuyor".
 */
export function keptHidden(type: SourceType, values: SourceValues): (SourceIdentifier | SourceField)[] {
  const { identifier, open, tucked } = layouts[type];
  const shown = new Set<string>([...open, ...tucked, ...(identifier ? [identifier] : [])]);
  return formOrder.filter((key) => !shown.has(key) && isFilled(values[key]));
}
