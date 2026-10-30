import {
  type Calendar,
  type CalendarDate,
  calendarMonths,
  calendars,
  formatDate,
  formatGregorianRange,
  type Month,
  sortValue,
} from '@homelibra/core/date';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

/** A Date as the form holds it while the scholar types: Gün and Yıl as typed, Ay as chosen. */
export type DateDraft = { calendar: Calendar; day: string; month: number | null; year: string };

export const emptyDateDraft: DateDraft = { calendar: 'gregorian', day: '', month: null, year: '' };

export function dateToDraft(date: CalendarDate | null | undefined): DateDraft {
  if (!date) return emptyDateDraft;
  return { calendar: date.calendar, day: date.day?.toString() ?? '', month: date.month ?? null, year: `${date.year}` };
}

type ReadDate =
  { date: CalendarDate | null; problem?: undefined } | { date?: undefined; problem: 'needsYear' | 'notInCalendar' };

/** The Date a draft holds: null when it is empty, a problem when it is not a Date yet. */
export function readDateDraft({ calendar, day, month, year }: DateDraft): ReadDate {
  if (!year.trim()) return day.trim() || month !== null ? { problem: 'needsYear' } : { date: null };
  const date: CalendarDate = { calendar, year: Number(year) };
  if (month !== null) date.month = month;
  if (month !== null && day.trim()) date.day = Number(day);
  return sortValue(date) === null ? { problem: 'notInCalendar' } : { date };
}

/**
 * The Date field (#18 §1, Sade): a chip beside the label cycles Milâdî →
 * Hicrî → Rumî, always starting at Milâdî; then Gün · Ay · Yıl. Changing the
 * calendar clears Ay and Gün and keeps Yıl; Gün opens once Ay is chosen.
 * Under the field: the approximate Milâdî days and the form the Date is shown in.
 * `today` replaces the chip with a Bugün button, for Erişim tarihi (always Milâdî).
 */
export function DateInput({
  label,
  value,
  onChange,
  today = false,
}: {
  label: string;
  value: DateDraft;
  onChange: (value: DateDraft) => void;
  today?: boolean;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState<'day' | 'year' | null>(null);
  const [choosingMonth, setChoosingMonth] = useState(false);

  const { calendar, day, month, year } = value;
  const months = calendarMonths(calendar);
  const monthName = (m: Month) =>
    m.abbreviation ? t('date.monthWithAbbreviation', { name: m.name, abbreviation: m.abbreviation }) : m.name;
  const chosen = months.find((m) => m.month === month);
  const calendarName = t(`date.calendars.${calendar}`);
  const next = calendars[(calendars.indexOf(calendar) + 1) % calendars.length]!;

  const read = readDateDraft(value);
  const range = read.date && formatGregorianRange(read.date);
  const setToday = () => {
    const now = new Date();
    onChange({
      calendar: 'gregorian',
      day: `${now.getDate()}`,
      month: now.getMonth() + 1,
      year: `${now.getFullYear()}`,
    });
  };
  const digits = (text: string) => text.replace(/\D/g, '');

  return (
    <View style={styles.field}>
      <View style={styles.head}>
        <Text style={styles.label}>{label.toLocaleUpperCase('tr')}</Text>
        {!today && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('date.changeCalendar', { calendar: t(`date.calendars.${next}`) })}
            onPress={() => onChange({ calendar: next, day: '', month: null, year })}
            hitSlop={6}
            style={styles.calendarChip}
          >
            <Text style={styles.calendarChipText}>{calendarName} ↻</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.parts}>
        <TextInput
          accessibilityLabel={`${label}: ${t('date.day')}`}
          placeholder={t('date.day')}
          placeholderTextColor={colors.muted2}
          value={day}
          onChangeText={(text) => onChange({ ...value, day: digits(text) })}
          editable={month !== null}
          inputMode="numeric"
          maxLength={2}
          onFocus={() => setFocused('day')}
          onBlur={() => setFocused(null)}
          style={[styles.input, styles.day, month === null && styles.disabled, focused === 'day' && styles.focused]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${t('date.month')}`}
          onPress={() => setChoosingMonth(true)}
          style={[styles.input, styles.month]}
        >
          <Text style={[styles.inputText, !chosen && styles.placeholder]} numberOfLines={1}>
            {chosen ? monthName(chosen) : t('date.month')}
          </Text>
        </Pressable>
        <TextInput
          accessibilityLabel={`${label}: ${t('date.year')}`}
          placeholder={t('date.year')}
          placeholderTextColor={colors.muted2}
          value={year}
          onChangeText={(text) => onChange({ ...value, year: digits(text) })}
          inputMode="numeric"
          maxLength={4}
          onFocus={() => setFocused('year')}
          onBlur={() => setFocused(null)}
          style={[styles.input, styles.year, focused === 'year' && styles.focused]}
        />
      </View>
      {today && (
        <Pressable accessibilityRole="button" onPress={setToday} style={styles.today}>
          <Text style={styles.todayText}>{t('date.today')}</Text>
        </Pressable>
      )}
      {read.problem ? (
        <Text style={styles.problem}>
          {read.problem === 'needsYear' ? t('date.needsYear') : t('date.notInCalendar', { calendar: calendarName })}
        </Text>
      ) : (
        read.date && (
          <View>
            {range && <Text style={styles.hint}>{t('date.approximate', { range })}</Text>}
            <Text style={styles.hint}>{t('date.shownAs', { date: formatDate(read.date) })}</Text>
          </View>
        )
      )}

      <Modal visible={choosingMonth} transparent animationType="fade" onRequestClose={() => setChoosingMonth(false)}>
        <Pressable style={styles.backdrop} onPress={() => setChoosingMonth(false)}>
          <View style={styles.sheet}>
            <ScrollView>
              {[null, ...months].map((m) => (
                <Pressable
                  key={m?.month ?? 'none'}
                  accessibilityRole="radio"
                  aria-checked={(m?.month ?? null) === month}
                  onPress={() => {
                    // Gün needs an Ay.
                    onChange({ ...value, month: m?.month ?? null, day: m ? day : '' });
                    setChoosingMonth(false);
                  }}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <Text style={[styles.optionText, (m?.month ?? null) === month && styles.optionSelected]}>
                    {m ? monthName(m) : t('date.noMonth')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    field: { gap: 6 },
    head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    label: { ...typeScale.micro, color: c.muted },
    calendarChip: {
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: radius.chip,
      paddingHorizontal: 8,
      paddingVertical: 1,
    },
    calendarChipText: { ...typeScale.caption, fontFamily: typeScale.button.fontFamily, color: c.accent },
    parts: { flexDirection: 'row', gap: space.sm },
    input: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 46,
      justifyContent: 'center',
    },
    inputText: { ...typeScale.body, color: c.fg },
    placeholder: { color: c.muted2 },
    day: { width: 72 },
    month: { flex: 1 },
    year: { width: 92 },
    disabled: { opacity: 0.5 },
    // Design system Input: accent border and a 3px accent-soft ring.
    focused: { borderColor: c.accent, outlineColor: c.accentSoft, outlineWidth: 3, outlineStyle: 'solid' },
    today: { alignSelf: 'flex-start', paddingVertical: 4 },
    todayText: { ...typeScale.button, color: c.accent },
    hint: { ...typeScale.caption, color: c.muted },
    problem: { ...typeScale.caption, color: c.danger },
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: space.xl,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
      width: '100%',
      maxWidth: 360,
      maxHeight: '80%',
      backgroundColor: c.surface,
      borderRadius: radius.card,
      paddingVertical: space.sm,
    },
    option: { paddingVertical: 10, paddingHorizontal: space.lg },
    pressed: { backgroundColor: c.accentSub },
    optionText: { ...typeScale.body, color: c.fg },
    optionSelected: { color: c.accent, fontFamily: typeScale.button.fontFamily },
  });
