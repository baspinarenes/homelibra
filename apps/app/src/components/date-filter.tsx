import { type Calendar, calendars, formatDate, type YearRange, yearRange } from '@homelibra/core/date';
import { Segment } from '@homelibra/ui/segment';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

/**
 * The Tarih filter as the scholar types it (#122): one calendar for both
 * years, and Başlangıç and Bitiş as typed, either left blank.
 */
export type YearRangeDraft = { calendar: Calendar; from: string; to: string };

/** No year typed, Milâdî chosen. */
export const emptyYearRange: YearRangeDraft = { calendar: 'gregorian', from: '', to: '' };

const boundOf = (calendar: Calendar, year: string) => (year.trim() ? { calendar, year: Number(year) } : null);

/** Whether a year is typed on either side. */
export const hasYear = (draft: YearRangeDraft) => draft.from.trim() !== '' || draft.to.trim() !== '';

/**
 * The years the filter keeps, as `sources.list` and `search.library` take
 * them: null while no year is typed or a year is not in its calendar
 * (1400 r.), when the filter keeps everything.
 */
export function yearRangeOf(draft: YearRangeDraft): YearRange | null {
  const range: YearRange = { from: boundOf(draft.calendar, draft.from), to: boundOf(draft.calendar, draft.to) };
  return (range.from || range.to) && yearRange(range) ? range : null;
}

/** The years as a filter chip shows them: "1324 r. – 1330 r.", "1500 – …". */
export function yearRangeLabel(range: YearRange, open: string) {
  const side = (bound: YearRange['from']) => (bound ? formatDate(bound) : open);
  return `${side(range.from)} – ${side(range.to)}`;
}

/**
 * The Tarih filter's fields, for a Filtrele sheet (Kaynaklar, Ara): a Milâdî |
 * Hicrî | Rumî segment over Başlangıç and Bitiş years on the number pad.
 * Below, the Milâdî years a Hicrî or Rumî range stands for ("≈ 1908–1915
 * Milâdî") and that undated Sources are hidden, or the year its calendar
 * does not have. Sources are compared by the first day of their Date.
 */
export function YearRangeFields({
  value,
  onChange,
}: {
  value: YearRangeDraft;
  onChange: (value: YearRangeDraft) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const bounds = yearRange({ from: boundOf(value.calendar, value.from), to: boundOf(value.calendar, value.to) });
  // The year its calendar does not have, for the message.
  const missing = [value.from, value.to].find((year) => {
    const bound = boundOf(value.calendar, year);
    return bound && !yearRange({ from: bound });
  });
  const year = (side: 'from' | 'to') => (
    <View style={styles.year}>
      {/* Read out by the field itself. */}
      <Text aria-hidden style={styles.yearLabel}>
        {t(`dateFilter.${side}`)}
      </Text>
      <TextField
        label={t(`dateFilter.${side}`)}
        labelHidden
        placeholder={t('dateFilter.year')}
        value={value[side]}
        onChangeText={(text) => onChange({ ...value, [side]: text.replace(/\D/g, '') })}
        inputMode="numeric"
        keyboardType="number-pad"
        maxLength={4}
      />
    </View>
  );

  return (
    <View style={styles.fields}>
      <Segment
        label={t('dateFilter.calendar')}
        options={calendars.map((calendar) => ({ value: calendar, label: t(`date.calendars.${calendar}`) }))}
        value={value.calendar}
        onChange={(calendar) => onChange({ ...value, calendar })}
        block
      />
      <View style={styles.years}>
        {year('from')}
        <Text style={styles.dash}>–</Text>
        {year('to')}
      </View>
      {missing ? (
        <Text style={styles.problem}>
          {t('dateFilter.notInCalendar', { year: missing, calendar: t(`date.calendars.${value.calendar}`) })}
        </Text>
      ) : (
        <Text style={styles.hint}>
          {value.calendar !== 'gregorian' && hasYear(value) && bounds
            ? t('dateFilter.hint', {
                from: bounds.gregorian.from ?? t('dateFilter.open'),
                to: bounds.gregorian.to ?? t('dateFilter.open'),
              })
            : t('dateFilter.lead')}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    fields: { gap: 6 },
    years: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
    year: { flex: 1, gap: 6 },
    yearLabel: { ...typeScale.label, fontSize: 13, lineHeight: 16, color: c.ink2 },
    // Level with the inputs' text, whatever the label above them.
    dash: { ...typeScale.body, width: 14, paddingBottom: 12, textAlign: 'center', color: c.muted },
    hint: { ...typeScale.caption, color: c.muted },
    problem: { ...typeScale.caption, color: c.danger },
  });
