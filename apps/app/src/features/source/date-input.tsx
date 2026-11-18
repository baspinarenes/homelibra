import { titleCaseTr } from '@homelibra/core';
import {
  type Calendar,
  type CalendarDate,
  calendarMonths,
  calendars,
  type DateWheels,
  dateWheels,
  formatDate,
  formatGregorianRange,
  isExactInGregorian,
  turnWheels,
  wheelChoices,
  wheelsDate,
} from '@homelibra/core/date';
import { Button } from '@homelibra/ui/button';
import { Segment } from '@homelibra/ui/segment';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { Wheels } from '@homelibra/ui/wheels';
import Info from 'lucide-react-native/icons/info';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Linking, Pressable, View } from 'react-native';

import { type DateDraft, dateToDraft, readDateDraft } from '@/features/source/date-draft';

/** A Date with its month written out, as the field shows it: "2 Rebîülevvel 1327". */
function writeOut({ calendar, year, month, day }: CalendarDate): string {
  const name = calendarMonths(calendar).find((m) => m.month === month)?.name;
  return [day, name, year].filter((part) => part !== undefined).join(' ');
}

const todayDate = (): CalendarDate => {
  const now = new Date();
  return { calendar: 'gregorian', year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
};

/**
 * The Date field (#112): one input showing the Date, its calendar small at
 * the right, that opens the date picker sheet. Under it, for a Hicrî or
 * Rumî Date, the Milâdî days (≈ when approximate, with ⓘ saying why).
 * `today` is for Erişim tarihi: Milâdî only, with Bugün, never past this year.
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
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);
  const [explaining, setExplaining] = useState(false);

  const date = readDateDraft(value).date ?? null;
  const shown = date && writeOut(date);
  const range = date && formatGregorianRange(date);
  const exact = date ? isExactInGregorian(date) : true;

  return (
    <View className="gap-1.5">
      <Text variant="fieldLabel">{label}</Text>
      <Pressable
        role="button"
        aria-label={`${label}: ${shown ?? t('date.pick')}`}
        onPress={() => {
          // The sheet opens no keyboard, nor stands on one a field left up.
          Keyboard.dismiss();
          setPicking(true);
        }}
        className="min-h-11.5 flex-row items-center justify-between gap-3 rounded-control border border-line bg-surface px-3.5 py-3"
      >
        <Text variant="body" color={shown ? 'fg' : 'muted2'} className="shrink" numberOfLines={1}>
          {shown ?? t('date.pick')}
        </Text>
        {date && !today && <Text variant="caption">{t(`date.calendars.${date.calendar}`)}</Text>}
      </Pressable>
      {range && (
        <View className="flex-row items-center gap-1.5">
          <Text variant="caption">{t(exact ? 'date.exact' : 'date.approximate', { range })}</Text>
          {!exact && (
            <Pressable
              role="button"
              aria-label={t('date.whyApproximate')}
              onPress={() => setExplaining(true)}
              hitSlop={8}
            >
              <Info color={colors.muted} size={14} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
      )}

      <DatePicker
        visible={picking}
        // The field's label, in Title Case like every sheet's heading.
        title={titleCaseTr(label)}
        date={date ?? (today ? todayDate() : null)}
        today={today}
        onClose={() => setPicking(false)}
        onChoose={(chosen) => {
          onChange(dateToDraft(chosen));
          setPicking(false);
        }}
      />
      {date && (
        <ApproximationSheet visible={explaining} calendar={date.calendar} onClose={() => setExplaining(false)} />
      )}
    </View>
  );
}

/**
 * The date picker sheet: Milâdî | Hicrî | Rumî, then the Gün · Ay · Yıl
 * wheels and, as they turn, the Milâdî days and the form the Date is shown
 * in. Tarihsiz empties the field, Tamam takes the wheels' Date, Kapat
 * leaves the field as it was. No keyboard opens.
 */
function DatePicker({
  visible,
  title,
  date,
  today,
  onClose,
  onChoose,
}: {
  visible: boolean;
  title: string;
  /** Where the wheels start: the field's Date, today for an empty Erişim tarihi. */
  date: CalendarDate | null;
  today: boolean;
  onClose: () => void;
  onChoose: (date: CalendarDate | null) => void;
}) {
  const { t } = useTranslation();
  const [wheels, setWheels] = useState<DateWheels>(() => dateWheels(date));
  // Each opening starts from the field's Date.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setWheels(dateWheels(date));
  }

  const turn = (change: Parameters<typeof turnWheels>[1]) => setWheels((w) => turnWheels(w, change));
  const latestYear = today ? new Date().getFullYear() : undefined;
  const { years, months, days, dayOpen } = wheelChoices(wheels, { latestYear });
  const none = { value: null, label: t('date.none') };

  const picked = wheelsDate(wheels);
  const range = formatGregorianRange(picked);
  const shownAs = t('date.shownAs', { date: formatDate(picked) });

  return (
    <Sheet
      visible={visible}
      title={title}
      closeLabel={t('date.close')}
      onClose={onClose}
      secondary={{ label: t('date.undated'), onPress: () => onChoose(null) }}
      primary={{ label: t('date.done'), onPress: () => onChoose(picked) }}
    >
      {today ? (
        <View className="min-h-10 flex-row items-center justify-between">
          <Text variant="fieldLabel">{t('date.calendars.gregorian')}</Text>
          <Button label={t('date.today')} variant="text" onPress={() => setWheels(dateWheels(todayDate()))} />
        </View>
      ) : (
        <Segment
          label={t('date.calendar')}
          options={calendars.map((calendar) => ({ value: calendar, label: t(`date.calendars.${calendar}`) }))}
          value={wheels.calendar}
          onChange={(calendar) => turn({ calendar })}
          block
        />
      )}
      <Wheels
        columns={[
          {
            label: t('date.day'),
            options: [none, ...days.map((d) => ({ value: d, label: `${d}` }))],
            value: wheels.day,
            onChange: (day) => turn({ day }),
            disabled: !dayOpen,
            width: 56,
          },
          {
            label: t('date.month'),
            options: [
              none,
              ...months.map((m) => ({
                value: m.month,
                label: m.abbreviation
                  ? t('date.monthWithAbbreviation', { name: m.name, abbreviation: m.abbreviation })
                  : m.name,
              })),
            ],
            value: wheels.month,
            onChange: (month) => turn({ month }),
            align: 'start',
          },
          {
            label: t('date.year'),
            options: years.map((y) => ({ value: y, label: `${y}` })),
            value: wheels.year,
            onChange: (year) => year !== null && turn({ year }),
            width: 84,
          },
        ]}
      />
      <View className="items-center gap-0.5">
        {range && (
          <Text variant="label" color="ink2" className="text-center">
            {t(isExactInGregorian(picked) ? 'date.exact' : 'date.approximate', { range })}
          </Text>
        )}
        <Text variant="label" color={range ? 'muted' : 'ink2'} className="text-center">
          {shownAs}
        </Text>
      </View>
    </Sheet>
  );
}

// Why a Date's Milâdî days are approximate, and where the rule comes from (#17).
const approximations = {
  hijri: { reason: 'date.hijriDrift', source: 'date.ttkGuide', url: 'https://www.ttk.gov.tr/tarih-cevirme-kilavuzu/' },
  rumi: { reason: 'date.earlyRumi', source: 'date.tdvTakvim', url: 'https://islamansiklopedisi.org.tr/takvim' },
} as const;

/** "Neden yaklaşık?": why the Milâdî days under a Hicrî or early Rumî Date are approximate. */
function ApproximationSheet({
  visible,
  calendar,
  onClose,
}: {
  visible: boolean;
  calendar: Calendar;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (calendar === 'gregorian') return null;
  const { reason, source, url } = approximations[calendar];

  return (
    <Sheet visible={visible} title={t('date.whyApproximate')} closeLabel={t('date.close')} onClose={onClose}>
      <Text variant="body" color="ink3">
        {t(reason)}
      </Text>
      <Text variant="link" role="link" onPress={() => Linking.openURL(url)}>
        {t(source)}
      </Text>
    </Sheet>
  );
}
