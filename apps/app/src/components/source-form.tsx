import type { AppRouter } from '@homelibra/api';
import { type CalendarDate, formatDate } from '@homelibra/core/date';
import {
  isFilled,
  isSourceDateField,
  keptHidden,
  normalizeDoi,
  type SourceDateField,
  sourceDateFields,
  type SourceField,
  sourceFields,
  type SourceIdentifier,
  sourceLayout,
  type SourceTextField,
  type SourceType,
  sourceTypes,
} from '@homelibra/core/source';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';

import { type DateDraft, DateInput, dateToDraft, emptyDateDraft, readDateDraft } from '@/components/date-input';
import { Field } from '@/components/field';
import { PrimaryButton } from '@/components/primary-button';
import { SourceTypeIcon } from '@/components/source-type-icon';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles, wideMinWidth } from '@/theme';

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
function withDoiFill(draft: SourceDraft, { doi, title, author, date, fields }: DoiFill): SourceDraft {
  return {
    ...draft,
    title: title ?? draft.title,
    author: author ?? draft.author,
    date: date ? dateToDraft(date) : draft.date,
    values: { ...draft.values, ...fields, doi },
  };
}

/** The Dates a draft's Date fields hold; a field still being typed holds none. */
function filledDates(dates: SourceDraft['dates']): Partial<Record<SourceDateField, CalendarDate>> {
  return Object.fromEntries(
    sourceDateFields.flatMap((key) => {
      const read = readDateDraft(dates[key]);
      return read.date ? [[key, read.date]] : [];
    }),
  );
}

/** After a save: refresh every Source query and go back to where the form was opened. */
export function useLeaveAfterSave() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() });
    if (router.canGoBack()) router.back();
    else router.replace('/sources');
  };
}

/**
 * Every value the form holds, hidden ones included; a blank one empties its
 * field. A hidden Date field still being typed is left as it is stored.
 */
export function draftToInput({ values, dates, date, ...draft }: SourceDraft) {
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
 * The Source form, Sade variant (#18): Tür → ISBN/DOI → Başlık → Yazar →
 * Tarih → type-specific fields (sparse ones behind a button) → Künye notu.
 * Only Tür and Başlık are required. A type change hides fields and never
 * clears them.
 */
export function SourceForm({
  screenTitle,
  initial,
  saving,
  failed,
  onSave,
}: {
  screenTitle: string;
  initial: SourceDraft;
  saving: boolean;
  failed: boolean;
  onSave: (draft: SourceDraft) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= wideMinWidth;
  const [draft, setDraft] = useState(initial);
  const [tuckedOpen, setTuckedOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const doiFill = useMutation({
    mutationFn: (doi: string) => queryClient.fetchQuery(trpc.lookups.doi.queryOptions({ doi })),
    onSuccess: (fill) => fill && setDraft((d) => withDoiFill(d, fill)),
  });
  const doi = normalizeDoi(draft.values.doi ?? '');

  const layout = sourceLayout(draft.type);
  const typeFields = [...layout.open, ...(tuckedOpen ? layout.tucked : [])];
  // A Date the form shows must be a Date or empty; a hidden one being typed is left alone.
  const datesReady = [draft.date, ...typeFields.filter(isSourceDateField).map((key) => draft.dates[key])].every(
    (date) => !readDateDraft(date).problem,
  );
  const canSave = draft.title.trim() !== '' && datesReady && !saving;
  const save = () => canSave && onSave(draft);
  // A new type starts with its sparse fields behind the button again.
  const changeType = (type: SourceType) => {
    setDraft((d) => ({ ...d, type }));
    setTuckedOpen(false);
  };
  const setValue = (key: SourceIdentifier | SourceTextField, value: string) => {
    // What was said about the DOI before no longer holds.
    if (key === 'doi') doiFill.reset();
    setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));
  };
  const setDate = (key: SourceDateField, value: DateDraft) =>
    setDraft((d) => ({ ...d, dates: { ...d.dates, [key]: value } }));

  const values = { ...draft.values, ...filledDates(draft.dates) };
  const tuckedFilled = layout.tucked.filter((key) => isFilled(values[key])).length;
  const kept = keptHidden(draft.type, values);
  const keptValue = (key: SourceIdentifier | SourceField) => {
    const value = values[key];
    return typeof value === 'string' ? value.trim() : value ? formatDate(value) : '';
  };
  const typeText = t(`sourceTypes.${draft.type}`, { returnObjects: true });

  const fieldInput = (key: SourceIdentifier | SourceField, extra?: TextInputProps) =>
    isSourceDateField(key) ? (
      <DateInput
        key={key}
        label={t(`sourceFields.${key}`)}
        value={draft.dates[key]}
        onChange={(value) => setDate(key, value)}
        today={key === 'accessDate'}
      />
    ) : (
      <Field
        key={key}
        label={t(`sourceFields.${key}`)}
        value={draft.values[key] ?? ''}
        onChangeText={(value) => setValue(key, value)}
        placeholder={key === 'container' ? t('sourceForm.containerExample') : undefined}
        autoCapitalize={key === 'url' || key === 'doi' ? 'none' : undefined}
        {...extra}
      />
    );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: screenTitle,
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={save} disabled={!canSave} hitSlop={8}>
              <Text style={[styles.headerSave, !canSave && styles.inactive]}>{t('sourceForm.save')}</Text>
            </Pressable>
          ),
        }}
      />
      <View style={[styles.form, wide && styles.formWide]}>
        <View style={styles.field}>
          <Text style={styles.label}>{t('sourceForm.type').toLocaleUpperCase('tr')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('sourceForm.type')} style={styles.types}>
            {sourceTypes.map((type) => (
              <View key={type} style={[styles.typeCell, { width: wide ? '20%' : '33.333%' }]}>
                <TypeChip type={type} selected={type === draft.type} onPress={() => changeType(type)} />
              </View>
            ))}
          </View>
        </View>

        {layout.identifier && fieldInput(layout.identifier, { autoCapitalize: 'none', autoCorrect: false })}
        {layout.identifier === 'doi' && (
          <View style={styles.lookup}>
            <Pressable
              accessibilityRole="button"
              onPress={() => doi && doiFill.mutate(doi)}
              disabled={!doi || doiFill.isPending}
              hitSlop={6}
            >
              <Text style={[styles.lookupAction, !doi && styles.inactive]}>
                {doiFill.isPending ? t('sourceForm.doiFilling') : t('sourceForm.doiFill')}
              </Text>
            </Pressable>
            {(doiFill.isSuccess || doiFill.isError) && (
              <Text style={styles.lookupStatus}>
                {doiFill.isError
                  ? t('sourceForm.doiFailed')
                  : doiFill.data
                    ? t('sourceForm.doiFilled')
                    : t('sourceForm.doiNotFound')}
              </Text>
            )}
          </View>
        )}

        <Field
          label={t('sourceForm.title')}
          required
          value={draft.title}
          onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
          placeholder={typeText.titleExample}
          serif
        />
        <Field
          label={t('sourceForm.author')}
          value={draft.author}
          onChangeText={(author) => setDraft((d) => ({ ...d, author }))}
          placeholder={typeText.authorExample}
        />
        <DateInput
          label={typeText.dateLabel}
          value={draft.date}
          onChange={(date) => setDraft((d) => ({ ...d, date }))}
        />

        {typeFields.length > 0 && (
          <View style={wide ? styles.columns : styles.stack}>
            {typeFields.map((key) => (
              <View key={key} style={wide && styles.column}>
                {fieldInput(key)}
              </View>
            ))}
          </View>
        )}

        {!tuckedOpen && layout.tucked.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => setTuckedOpen(true)} style={styles.more}>
            <Text style={styles.moreText}>
              {t('sourceForm.showTucked', { fields: layout.tucked.map((key) => t(`sourceFields.${key}`)).join(', ') })}
              {tuckedFilled > 0 && (
                <Text style={styles.moreCount}> {t('sourceForm.tuckedFilled', { count: tuckedFilled })}</Text>
              )}
            </Text>
          </Pressable>
        )}

        {kept.length > 0 && (
          <Text style={styles.kept}>
            {t('sourceForm.keptHidden', {
              fields: kept
                .map((key) =>
                  t('sourceForm.keptHiddenItem', {
                    field: t(`sourceFields.${key}`),
                    value: keptValue(key),
                  }),
                )
                .join(' · '),
            })}
          </Text>
        )}

        <Field
          label={t('sourceForm.bibliographicNote')}
          value={draft.bibliographicNote}
          onChangeText={(bibliographicNote) => setDraft((d) => ({ ...d, bibliographicNote }))}
          placeholder={t('sourceForm.bibliographicNoteExample')}
          multiline
        />

        {failed && <Text style={styles.error}>{t('sourceForm.saveFailed')}</Text>}
        <View style={wide && styles.saveWide}>
          <PrimaryButton label={t('sourceForm.save')} onPress={save} busy={saving} disabled={!canSave} />
        </View>
      </View>
    </ScrollView>
  );
}

function TypeChip({ type, selected, onPress }: { type: SourceType; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      onPress={onPress}
      style={[styles.typeChip, selected && styles.typeChipSelected]}
    >
      <View style={styles.typeHead}>
        <SourceTypeIcon type={type} color={selected ? colors.accent : colors.ink2} />
        {/* Wraps on a phone rather than cutting "Süreli yayın" short. */}
        <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{t(`sourceTypes.${type}.label`)}</Text>
      </View>
      <Text style={styles.typeScope}>{t(`sourceTypes.${type}.scope`)}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xxl },
    form: { gap: space.lg },
    formWide: { width: '100%', maxWidth: 860, alignSelf: 'center' },
    field: { gap: 6 },
    label: { ...typeScale.micro, color: c.muted },
    types: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
    typeCell: { padding: 3 },
    typeChip: {
      flex: 1,
      gap: 2,
      paddingVertical: 8,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      backgroundColor: c.surface,
    },
    typeChipSelected: { borderColor: c.accent, backgroundColor: c.accentSub },
    typeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    typeLabel: { ...typeScale.label, color: c.fg, flexShrink: 1, marginTop: -1 },
    typeLabelSelected: { color: c.accent },
    typeScope: { ...typeScale.caption, fontSize: 11, lineHeight: 14, color: c.muted },
    stack: { gap: space.lg },
    columns: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg, marginHorizontal: -space.sm },
    column: { width: '50%', paddingHorizontal: space.sm },
    more: { alignSelf: 'flex-start', paddingVertical: 6 },
    lookup: { gap: 4, marginTop: -space.sm, alignItems: 'flex-start' },
    lookupAction: { ...typeScale.button, color: c.accent },
    lookupStatus: { ...typeScale.caption, color: c.muted },
    moreText: { ...typeScale.button, color: c.accent },
    moreCount: { ...typeScale.caption, color: c.muted },
    kept: {
      ...typeScale.caption,
      color: c.muted,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.line,
      borderRadius: radius.input,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    error: { ...typeScale.body, color: c.danger },
    saveWide: { alignSelf: 'flex-end' },
    headerSave: { ...typeScale.button, fontSize: 15, color: c.accent, paddingHorizontal: space.sm },
    inactive: { opacity: 0.45 },
  });
