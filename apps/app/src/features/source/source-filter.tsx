import { type CalendarDate, inYearRange, type YearRange } from '@homelibra/core/date';
import { type SourceType, sourceTypes } from '@homelibra/core/source';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { Segment } from '@homelibra/ui/segment';
import { Sheet, SheetField } from '@homelibra/ui/sheet';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  emptyYearRange,
  hasYear,
  type YearRangeDraft,
  YearRangeFields,
  yearRangeLabel,
  yearRangeOf,
} from '@/features/search/date-filter';
import type { SourceSort } from '@/features/source/source-order';

/** Kaynaklar's Tür and Tarih filters; a filter with nothing chosen keeps all. */
export type SourceFilters = { types: SourceType[]; dates: YearRangeDraft };

/** What Filtrele ve sırala sets on a phone: the order, and the filters. */
export type Choices = SourceFilters & { sort: SourceSort };

export const noFilters: SourceFilters = { types: [], dates: emptyYearRange };

/** Whether the Tür or the Tarih filter narrows the list. */
export const filtering = ({ types, dates }: SourceFilters) => types.length > 0 || yearRangeOf(dates) !== null;

/** Every filter off, the order and the calendar kept. */
export const unfiltered = <T extends SourceFilters>(choices: T): T => ({
  ...choices,
  types: [],
  dates: { ...emptyYearRange, calendar: choices.dates.calendar },
});

/** The test the filters put a Source to, by the rule `sources.list` follows: for the live count. */
export function sourceFilter({ types, dates }: SourceFilters) {
  const range = yearRangeOf(dates);
  return (source: { type: SourceType; date: CalendarDate | null }) =>
    (types.length === 0 || types.includes(source.type)) && (!range || inYearRange(source.date, range));
}

/**
 * The chips naming the filters that are on, × taking each off: the years,
 * then the types. `named` puts the filter's name before what it keeps
 * ("Tür: Kitap"), as the wide header has them.
 */
export function FilterChips({
  filters,
  onChange,
  named = false,
}: {
  filters: SourceFilters;
  onChange: (filters: SourceFilters) => void;
  named?: boolean;
}) {
  const { t } = useTranslation();
  const dates: YearRange | null = yearRangeOf(filters.dates);
  const types = sourceTypes
    .filter((type) => filters.types.includes(type))
    .map((type) => t(`sourceTypes.${type}.label`))
    .join(', ');
  const years = dates && yearRangeLabel(dates, t('dateFilter.open'));
  return (
    <ChipRow>
      {years && (
        <Chip
          label={named ? t('sourceTable.datesChip', { range: years }) : years}
          selected
          removable
          onPress={() => onChange({ ...filters, dates: unfiltered(filters).dates })}
        />
      )}
      {types !== '' && (
        <Chip
          label={named ? t('sourceTable.typesChip', { types }) : types}
          selected
          removable
          onPress={() => onChange({ ...filters, types: [] })}
        />
      )}
    </ChipRow>
  );
}

/** Tür (the nine types, any number chosen) and Tarih (one calendar, two years). */
function FilterFields<T extends SourceFilters>({ draft, onChange }: { draft: T; onChange: (draft: T) => void }) {
  const { t } = useTranslation();
  const toggle = (type: SourceType) =>
    onChange({
      ...draft,
      types: draft.types.includes(type) ? draft.types.filter((other) => other !== type) : [...draft.types, type],
    });
  return (
    <>
      <SheetField label={t('sources.types')}>
        <ChipRow>
          {sourceTypes.map((type) => (
            <Chip
              key={type}
              label={t(`sourceTypes.${type}.label`)}
              tone="outline"
              selected={draft.types.includes(type)}
              onPress={() => toggle(type)}
            />
          ))}
        </ChipRow>
      </SheetField>
      <SheetField label={t('sources.dates')}>
        <YearRangeFields value={draft.dates} onChange={(dates) => onChange({ ...draft, dates })} />
      </SheetField>
    </>
  );
}

/** A year its calendar does not have (1400 r.) cannot be applied. */
const yearMissing = (draft: SourceFilters) => hasYear(draft.dates) && yearRangeOf(draft.dates) === null;
const nothingChosen = (draft: SourceFilters) => draft.types.length === 0 && !hasYear(draft.dates);

/**
 * Filtrele ve sırala, a phone's sheet: Sırala (Son not, Başlık, Yazar,
 * Tarih; no direction), Tür and Tarih; Temizle and "N kaynağı göster", N
 * following the choices.
 */
export function FilterSheet({
  draft,
  onChange,
  count,
  onApply,
  onClose,
}: {
  /** Null while the sheet is closed. */
  draft: Choices | null;
  onChange: (draft: Choices) => void;
  count: number;
  onApply: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  // The last choices stay on screen while the sheet slides away.
  const [lastDraft, setLastDraft] = useState<Choices>(draft ?? { sort: 'last', ...noFilters });
  if (draft && draft !== lastDraft) setLastDraft(draft);

  return (
    <Sheet
      visible={draft !== null}
      title={t('sources.filter')}
      closeLabel={t('sources.close')}
      onClose={onClose}
      secondary={{
        label: t('sources.clear'),
        onPress: () => onChange(unfiltered(lastDraft)),
        disabled: nothingChosen(lastDraft),
      }}
      primary={{ label: t('sources.show', { count }), onPress: onApply, disabled: yearMissing(lastDraft) }}
    >
      <View className="gap-4.5">
        <SheetField label={t('sources.sort')}>
          <Segment
            label={t('sources.sort')}
            options={[
              { value: 'last', label: t('sourceList.byLast') },
              { value: 'title', label: t('sources.byTitle') },
              { value: 'author', label: t('sources.byAuthor') },
              { value: 'date', label: t('sources.byDate') },
            ]}
            value={lastDraft.sort}
            onChange={(sort) => onChange({ ...lastDraft, sort })}
            block
          />
        </SheetField>
        <FilterFields draft={lastDraft} onChange={onChange} />
      </View>
    </Sheet>
  );
}

/**
 * Filtrele on a wide screen (#179): only Tür and Tarih, the column headings
 * being where the order is chosen. It opens in the page under the header,
 * beside nothing and over nothing; Temizle and "N kaynağı göster" as in the
 * phone's sheet.
 */
export function FilterPanel({
  draft,
  onChange,
  count,
  onApply,
}: {
  draft: SourceFilters;
  onChange: (draft: SourceFilters) => void;
  count: number;
  onApply: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="max-w-[640px] gap-4.5 pt-md pb-lg">
      <FilterFields draft={draft} onChange={onChange} />
      <View className="flex-row gap-sm">
        <Button
          label={t('sources.clear')}
          variant="secondary"
          onPress={() => onChange(unfiltered(draft))}
          disabled={nothingChosen(draft)}
        />
        <Button label={t('sources.show', { count })} onPress={onApply} disabled={yearMissing(draft)} />
      </View>
    </View>
  );
}
