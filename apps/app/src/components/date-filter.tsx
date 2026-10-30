import { type Calendar, calendars, formatDate, type YearRange, yearRange } from '@homelibra/core/date';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSettled } from '@/lib/settled';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type Side = 'from' | 'to';

/** One year of the filter as typed, with the calendar its chip shows. */
type YearDraft = { calendar: Calendar; year: string };

/** The Tarih filter as the scholar sets it: Başlangıç and Bitiş, each with its own calendar chip. */
export type DateFilterDraft = Record<Side, YearDraft>;

const emptyDraft: DateFilterDraft = {
  from: { calendar: 'gregorian', year: '' },
  to: { calendar: 'gregorian', year: '' },
};

const boundOf = ({ calendar, year }: YearDraft) => (year.trim() ? { calendar, year: Number(year) } : null);

/**
 * The Tarih filter's state for a list (#40, story 164). `range` is what the
 * list asks the server for once typing settles: null while no year is set
 * or a year is not in its calendar (the panel says which).
 */
export function useDateFilter() {
  const [draft, setDraft] = useState(emptyDraft);
  const settled = useSettled(draft);
  const range = useMemo(() => {
    const value: YearRange = { from: boundOf(settled.from), to: boundOf(settled.to) };
    return (value.from || value.to) && yearRange(value) ? value : null;
  }, [settled]);
  return { draft, setDraft, range };
}

/**
 * "Tarih: tümü ▾", or the years set ("Tarih: 1324 r. – 1330 r."); it opens
 * the panel: Başlangıç and Bitiş years, a chip beside each cycling Milâdî
 * → Hicrî → Rumî (as in the Source form), Temizle, and the Milâdî years the
 * filter stands for ("≈ 1908–1915 Milâdî"). Sources are compared by the
 * first day of their Date; those without one are hidden.
 */
export function DateFilter({
  draft,
  onChange,
}: {
  draft: DateFilterDraft;
  onChange: (draft: DateFilterDraft) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const active = draft.from.year.trim() !== '' || draft.to.year.trim() !== '';
  const shown = (side: Side) => {
    const bound = boundOf(draft[side]);
    return bound ? formatDate(bound) : t('dateFilter.open');
  };
  const range = { from: boundOf(draft.from), to: boundOf(draft.to) };
  const bounds = yearRange(range);
  // The year its calendar does not have, for the message.
  const missing = (['from', 'to'] as const).find((side) => {
    const bound = range[side];
    return bound && !yearRange({ from: bound });
  });

  return (
    <View style={styles.filter}>
      <Pressable
        accessibilityRole="button"
        aria-expanded={open}
        onPress={() => setOpen(!open)}
        style={({ pressed }) => [styles.toggle, active && styles.toggleActive, pressed && styles.pressed]}
      >
        <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
          {t('dateFilter.label', { range: active ? `${shown('from')} – ${shown('to')}` : t('dateFilter.any') })} ▾
        </Text>
      </Pressable>
      {open && (
        <View style={styles.panel}>
          <View style={styles.years}>
            <YearField
              label={t('dateFilter.from')}
              value={draft.from}
              onChange={(from) => onChange({ ...draft, from })}
            />
            <YearField label={t('dateFilter.to')} value={draft.to} onChange={(to) => onChange({ ...draft, to })} />
            {active && (
              <Pressable accessibilityRole="button" onPress={() => onChange(emptyDraft)} hitSlop={8}>
                <Text style={styles.clear}>{t('dateFilter.clear')}</Text>
              </Pressable>
            )}
          </View>
          {missing ? (
            <Text style={styles.problem}>
              {t('dateFilter.notInCalendar', {
                year: draft[missing].year,
                calendar: t(`date.calendars.${draft[missing].calendar}`),
              })}
            </Text>
          ) : (
            <Text style={styles.hint}>
              {active && bounds
                ? t('dateFilter.hint', {
                    from: bounds.gregorian.from ?? t('dateFilter.open'),
                    to: bounds.gregorian.to ?? t('dateFilter.open'),
                  })
                : t('dateFilter.lead')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function YearField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: YearDraft;
  onChange: (value: YearDraft) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const next = calendars[(calendars.indexOf(value.calendar) + 1) % calendars.length]!;
  return (
    <View style={styles.year}>
      <Text style={styles.yearLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={t('dateFilter.year')}
        placeholderTextColor={colors.muted2}
        value={value.year}
        onChangeText={(text) => onChange({ ...value, year: text.replace(/\D/g, '') })}
        inputMode="numeric"
        maxLength={4}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('dateFilter.changeCalendar', { side: label, calendar: t(`date.calendars.${next}`) })}
        onPress={() => onChange({ ...value, calendar: next })}
        hitSlop={6}
        style={styles.chip}
      >
        <Text style={styles.chipText}>{t(`date.calendars.${value.calendar}`)} ↻</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    filter: { gap: space.sm },
    pressed: { opacity: 0.7 },
    toggle: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.button,
      paddingVertical: 6,
      paddingHorizontal: space.md,
    },
    toggleActive: { borderColor: c.accent },
    toggleText: { ...typeScale.label, color: c.ink2 },
    toggleTextActive: { color: c.accent },
    panel: { gap: space.sm, paddingBottom: space.xs },
    years: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md },
    year: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    yearLabel: { ...typeScale.caption, minWidth: 62, color: c.muted },
    input: {
      ...typeScale.body,
      width: 72,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    chip: {
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: radius.chip,
      paddingHorizontal: 8,
      paddingVertical: 1,
    },
    chipText: { ...typeScale.caption, fontFamily: typeScale.button.fontFamily, color: c.accent },
    clear: { ...typeScale.button, color: c.accent },
    hint: { ...typeScale.caption, color: c.muted },
    problem: { ...typeScale.caption, color: c.danger },
  });
