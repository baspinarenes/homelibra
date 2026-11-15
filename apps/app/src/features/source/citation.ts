import { type CalendarDate, formatDate } from '@homelibra/core/date';
import {
  isFilled,
  type SourceField,
  type SourceFieldValues,
  type SourceIdentifier,
  sourceLayout,
  type SourceType,
} from '@homelibra/core/source';

/** What a Source's künye is made of. */
export type CitedSource = {
  type: SourceType;
  author: string | null;
  date: CalendarDate | null;
  isbn: string | null;
  doi: string | null;
  bibliographicNote: string | null;
  fields: SourceFieldValues;
};

/** One line of the full künye: which field (to name it) and its value as shown. */
export type CitationRow = {
  key: 'author' | 'date' | SourceIdentifier | SourceField | 'bibliographicNote';
  value: string;
};

/**
 * A Source's künye on a wide Source page (#177): `line`, the one line under
 * its title (Yazar · Tarih · the fields its type shows open), and `rows`,
 * the full künye "Künyenin tamamı ›" opens: every filled field the type
 * shows, in the form's order, then Ek bilgi. `more` says the full künye
 * holds something the line does not. Fields a type hides, though kept
 * (#65), are not part of it; Dates are written as they were entered.
 */
export function citation(source: CitedSource): { line: string[]; rows: CitationRow[]; more: boolean } {
  const { identifier, open, tucked } = sourceLayout(source.type);
  const shown = (value: string | CalendarDate | null | undefined) =>
    !value || !isFilled(value) ? null : typeof value === 'string' ? value.trim() : formatDate(value);
  const rows = (keys: readonly CitationRow['key'][]) =>
    keys.flatMap((key) => {
      const value = shown(valueOf(source, key));
      return value === null ? [] : [{ key, value }];
    });
  const lineRows = rows(['author', 'date', ...open]);
  const all = rows(['author', 'date', ...(identifier ? [identifier] : []), ...open, ...tucked, 'bibliographicNote']);
  return { line: lineRows.map((row) => row.value), rows: all, more: all.length > lineRows.length };
}

function valueOf(source: CitedSource, key: CitationRow['key']) {
  switch (key) {
    case 'author':
    case 'date':
    case 'isbn':
    case 'doi':
    case 'bibliographicNote':
      return source[key];
    default:
      return source.fields[key];
  }
}
