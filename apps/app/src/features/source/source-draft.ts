import type { AppRouter } from '@homelibra/api';
import type { CalendarDate } from '@homelibra/core/date';
import {
  isSourceDateField,
  type SourceDateField,
  sourceDateFields,
  type SourceField,
  sourceFields,
  type SourceIdentifier,
  type SourceTextField,
  type SourceType,
} from '@homelibra/core/source';
import type { inferRouterOutputs } from '@trpc/server';

import { type DateDraft, dateToDraft, emptyDateDraft, readDateDraft } from '@/features/source/date-draft';
import type { IsbnSuggestion, SuggestedCover } from '@/features/source/isbn-suggestion';

// The Source form's values as they are being written (#18), and how they become a Source's.

type TextValues = Partial<Record<SourceIdentifier | SourceTextField, string>>;

export type SourceDraft = {
  type: SourceType;
  title: string;
  author: string;
  date: DateDraft;
  bibliographicNote: string;
  /** ISBN, DOI and the type-specific text fields, including the ones the current type hides. */
  values: TextValues;
  /** The type-specific Date fields, hidden ones included. */
  dates: Record<SourceDateField, DateDraft>;
  /** Open Library's cover accepted from ISBN ile öner; the Source gets a copy of it on save. */
  suggestedCover?: SuggestedCover | null;
};

const draftDates = (stored: Partial<Record<SourceDateField, CalendarDate>>) =>
  Object.fromEntries(sourceDateFields.map((key) => [key, dateToDraft(stored[key])])) as SourceDraft['dates'];

export const emptyDraft: SourceDraft = {
  type: 'book',
  title: '',
  author: '',
  date: emptyDateDraft,
  bibliographicNote: '',
  values: {},
  dates: draftDates({}),
};

type StoredSource = inferRouterOutputs<AppRouter>['sources']['get'];
type DoiFill = NonNullable<inferRouterOutputs<AppRouter>['lookups']['doi']>;

export function sourceToDraft(source: StoredSource): SourceDraft {
  const textFields = Object.fromEntries(Object.entries(source.fields).filter(([key]) => !isSourceDateField(key)));
  return {
    type: source.type,
    title: source.title,
    author: source.author ?? '',
    date: dateToDraft(source.date),
    bibliographicNote: source.bibliographicNote ?? '',
    values: { ...textFields, isbn: source.isbn ?? '', doi: source.doi ?? '' },
    dates: draftDates(source.fields),
  };
}

/**
 * DOI ile doldur: what Crossref gave replaces what the form held, the rest
 * stays. The Date comes Milâdî; the scholar may change its calendar after.
 * Whatever the scholar corrects is saved in their Source only.
 */
export function withDoiFill(draft: SourceDraft, { doi, title, author, date, fields }: DoiFill): SourceDraft {
  return {
    ...draft,
    title: title ?? draft.title,
    author: author ?? draft.author,
    date: date ? dateToDraft(date) : draft.date,
    values: { ...draft.values, ...fields, doi },
  };
}

/**
 * ISBN ile öner, accepted: what Open Library gave replaces what the form
 * held, the rest stays, as with DOI ile doldur. The ISBN stays as typed.
 */
export function withIsbnSuggestion(
  draft: SourceDraft,
  { title, author, date, fields }: IsbnSuggestion,
  suggestedCover: SuggestedCover | null,
): SourceDraft {
  return {
    ...draft,
    title: title ?? draft.title,
    author: author ?? draft.author,
    date: date ? dateToDraft(date) : draft.date,
    values: { ...draft.values, ...fields },
    suggestedCover: suggestedCover ?? draft.suggestedCover,
  };
}

/** The Dates a draft's Date fields hold; a field still being typed holds none. */
export function filledDates(dates: SourceDraft['dates']): Partial<Record<SourceDateField, CalendarDate>> {
  return Object.fromEntries(
    sourceDateFields.flatMap((key) => {
      const read = readDateDraft(dates[key]);
      return read.date ? [[key, read.date]] : [];
    }),
  );
}

/**
 * Every value the form holds, hidden ones included; a blank one empties its
 * field. A hidden Date field still being typed is left as it is stored.
 */
export function draftToInput({ values, dates, date, suggestedCover: _, ...draft }: SourceDraft) {
  const read = readDateDraft(date);
  return {
    ...draft,
    isbn: values.isbn ?? '',
    doi: values.doi ?? '',
    date: read.problem ? undefined : read.date,
    fields: Object.fromEntries(
      sourceFields.flatMap((key): [SourceField, string | CalendarDate | null][] => {
        if (!isSourceDateField(key)) return [[key, values[key] ?? '']];
        const field = readDateDraft(dates[key]);
        return field.problem ? [] : [[key, field.date]];
      }),
    ) as Partial<Record<SourceTextField, string> & Record<SourceDateField, CalendarDate | null>>,
  };
}

/**
 * Whether the form holds anything that closing it would throw away, against
 * the draft it was opened with: another Tür, a field written in (hidden ones
 * too), a Date even half written, Open Library's cover accepted. A field
 * written in and erased again holds nothing.
 */
export function draftChanged(initial: SourceDraft, draft: SourceDraft): boolean {
  return written(initial) !== written(draft);
}

/** What a draft holds, blank fields as no field, as one string to compare. */
function written({ type, title, author, date, bibliographicNote, values, dates, suggestedCover }: SourceDraft) {
  const text = (value: string | undefined) => value?.trim() ?? '';
  const dateText = ({ calendar, day, month, year }: DateDraft) =>
    text(year) || text(day) || month !== null ? [calendar, text(day), month, text(year)] : null;
  const keys = Object.keys(values) as (keyof TextValues)[];
  return JSON.stringify([
    type,
    text(title),
    text(author),
    dateText(date),
    text(bibliographicNote),
    keys
      .filter((key) => text(values[key]) !== '')
      .sort()
      .map((key) => [key, text(values[key])]),
    sourceDateFields.map((key) => dateText(dates[key])),
    suggestedCover?.isbn ?? null,
  ]);
}
