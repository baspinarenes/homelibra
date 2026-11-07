import type { AppRouter } from '@homelibra/api';
import { type CalendarDate, formatDate } from '@homelibra/core/date';
import {
  isFilled,
  isSourceDateField,
  keptHidden,
  normalizeDoi,
  normalizeIsbn,
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
import { HeaderTextAction } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, radius, space, useTheme, useThemedStyles, wideMinWidth } from '@homelibra/ui/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useRouter } from 'expo-router';
import Link from 'lucide-react-native/icons/link';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { type DateDraft, DateInput, dateToDraft, emptyDateDraft, readDateDraft } from '@/components/date-input';
import { IdentifierCard } from '@/components/identifier-card';
import { IsbnCard, type IsbnSuggestion, type SuggestedCover } from '@/components/isbn-suggestion';
import { SourceTypeIcon } from '@/components/source-type-icon';
import { useOffline } from '@/lib/network';
import { refreshLibrary } from '@/lib/refresh-library';
import { useTRPC } from '@/lib/trpc';

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
function withDoiFill(draft: SourceDraft, { doi, title, author, date, fields }: DoiFill): SourceDraft {
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
function withIsbnSuggestion(
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
function filledDates(dates: SourceDraft['dates']): Partial<Record<SourceDateField, CalendarDate>> {
  return Object.fromEntries(
    sourceDateFields.flatMap((key) => {
      const read = readDateDraft(dates[key]);
      return read.date ? [[key, read.date]] : [];
    }),
  );
}

/** After a save: refresh wherever the Source shows and go back to where the form was opened. */
export function useLeaveAfterSave() {
  const router = useRouter();
  return async () => {
    await refreshLibrary();
    if (router.canGoBack()) router.back();
    else router.replace('/sources');
  };
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
 * The Source form, Sade variant (#18): Tür → the ISBN/DOI card → Başlık →
 * Yazar → Tarih → type-specific fields (sparse ones behind a button) → Ek
 * bilgi. Only Tür and Başlık are required. A type change hides fields and
 * never clears them. Kaydet is only in the header (#120); a failed save and
 * being offline are said on a strip under it.
 */
export function SourceForm({
  screenTitle,
  initial,
  saving,
  failed,
  offlineNotice,
  onSave,
  footer,
}: {
  screenTitle: string;
  initial: SourceDraft;
  saving: boolean;
  failed: boolean;
  /** Why Kaydet does nothing offline: saving a Source is online only (#58). */
  offlineNotice: string;
  onSave: (draft: SourceDraft) => void;
  /** At the form's very foot: Kaynağı sil when editing. */
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const wide = Platform.OS === 'web' && width >= wideMinWidth;
  const [draft, setDraft] = useState(initial);
  const [tuckedOpen, setTuckedOpen] = useState(false);
  const offline = useOffline();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const doiFill = useMutation({
    mutationFn: (doi: string) => queryClient.fetchQuery(trpc.lookups.doi.queryOptions({ doi })),
    onSuccess: (fill) => fill && setDraft((d) => withDoiFill(d, fill)),
  });
  const doi = normalizeDoi(draft.values.doi ?? '');
  const doiHint = doiFill.isPending
    ? t('sourceForm.doiFilling')
    : doiFill.isError
      ? t('sourceForm.doiFailed')
      : doiFill.isSuccess
        ? doiFill.data
          ? t('sourceForm.doiFilled')
          : t('sourceForm.doiNotFound')
        : // Before anything is typed, the card says what asking brings.
          (draft.values.doi ?? '').trim() === ''
          ? t('sourceForm.doiHint')
          : null;

  const layout = sourceLayout(draft.type);
  const typeFields = [...layout.open, ...(tuckedOpen ? layout.tucked : [])];
  // A Date the form shows must be a Date or empty; a hidden one being typed is left alone.
  const datesReady = [draft.date, ...typeFields.filter(isSourceDateField).map((key) => draft.dates[key])].every(
    (date) => !readDateDraft(date).problem,
  );
  const canSave = draft.title.trim() !== '' && datesReady && !saving && !offline;
  const save = () => canSave && onSave(draft);
  // A new type starts with its sparse fields behind the button again.
  const changeType = (type: SourceType) => {
    setDraft((d) => ({ ...d, type }));
    setTuckedOpen(false);
  };
  const setValue = (key: SourceIdentifier | SourceTextField, value: string) => {
    // What was said about the DOI before no longer holds.
    if (key === 'doi') doiFill.reset();
    setDraft((d) => ({
      ...d,
      values: { ...d.values, [key]: value },
      // A cover accepted for another ISBN is not this book's.
      ...(key === 'isbn' &&
        d.suggestedCover &&
        normalizeIsbn(value) !== d.suggestedCover.isbn && { suggestedCover: null }),
    }));
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

  const fieldInput = (key: SourceField) =>
    isSourceDateField(key) ? (
      <DateInput
        key={key}
        label={t(`sourceFields.${key}`)}
        value={draft.dates[key]}
        onChange={(value) => setDate(key, value)}
        today={key === 'accessDate'}
      />
    ) : (
      <TextField
        key={key}
        label={t(`sourceFields.${key}`)}
        value={draft.values[key] ?? ''}
        onChangeText={(value) => setValue(key, value)}
        placeholder={key === 'container' ? t('sourceForm.containerExample') : undefined}
        autoCapitalize={key === 'url' ? 'none' : undefined}
      />
    );

  // Offline says why Kaydet does nothing; a failed save says to try again.
  const notice = offline ? offlineNotice : failed ? t('sourceForm.saveFailed') : null;

  return (
    <FormScreen notice={notice}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerRight: () => (
            <HeaderTextAction label={t('sourceForm.save')} onPress={save} disabled={!canSave} busy={saving} />
          ),
        }}
      />
      <View style={[styles.form, wide && styles.formWide]}>
        <View style={styles.field}>
          <Text variant="micro">{t('sourceForm.type')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('sourceForm.type')} style={styles.types}>
            {sourceTypes.map((type) => (
              <View key={type} style={[styles.typeCell, { width: wide ? '20%' : '33.333%' }]}>
                <TypeChip type={type} selected={type === draft.type} onPress={() => changeType(type)} />
              </View>
            ))}
          </View>
        </View>

        {layout.identifier === 'isbn' && (
          <IsbnCard
            isbn={draft.values.isbn ?? ''}
            onChangeIsbn={(value) => setValue('isbn', value)}
            onAccept={(suggestion, cover) => setDraft((d) => withIsbnSuggestion(d, suggestion, cover))}
            suggestedCover={draft.suggestedCover}
            onDropCover={() => setDraft((d) => ({ ...d, suggestedCover: null }))}
          />
        )}
        {layout.identifier === 'doi' && (
          <IdentifierCard
            label={t('sourceFields.doi')}
            value={draft.values.doi ?? ''}
            onChangeText={(value) => setValue('doi', value)}
            placeholder={t('sourceForm.doiPlaceholder')}
            action={{
              label: doiFill.isError ? t('sourceForm.identifierRetry') : t('sourceForm.doiFill'),
              icon: Link,
              onPress: () => doi && doiFill.mutate(doi),
              disabled: !doi,
              busy: doiFill.isPending,
            }}
            hint={doiHint}
            alert={doiFill.isError}
          />
        )}

        <TextField
          label={t('sourceForm.title')}
          required
          value={draft.title}
          onChangeText={(title) => setDraft((d) => ({ ...d, title }))}
          placeholder={typeText.titleExample}
        />
        <TextField
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
            <Text variant="button">
              {t('sourceForm.showTucked', {
                fields: layout.tucked.map((key) => t(`sourceFields.${key}`)).join(', '),
              })}
              {tuckedFilled > 0 && (
                <Text variant="caption"> {t('sourceForm.tuckedFilled', { count: tuckedFilled })}</Text>
              )}
            </Text>
          </Pressable>
        )}

        <TextField
          label={t('sourceForm.bibliographicNote')}
          value={draft.bibliographicNote}
          onChangeText={(bibliographicNote) => setDraft((d) => ({ ...d, bibliographicNote }))}
          placeholder={t('sourceForm.bibliographicNoteExample')}
          multiline
        />

        {kept.length > 0 && (
          <Text variant="caption">
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

        {footer}
      </View>
    </FormScreen>
  );
}

/** The form's screen: the strip under the header, when there is something to say, and the form scrolling below it. */
function FormScreen({ notice, children }: { notice: string | null; children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.screen}>
      {notice && (
        <View role="alert" style={styles.strip}>
          <Text variant="label" color="warn">
            {notice}
          </Text>
        </View>
      )}
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
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
        <Text variant="label" color={selected ? 'accent' : 'fg'} style={styles.typeLabel}>
          {t(`sourceTypes.${type}.label`)}
        </Text>
      </View>
      <Text variant="captionSm">{t(`sourceTypes.${type}.scope`)}</Text>
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
    types: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },
    typeCell: { padding: 3 },
    typeChip: {
      flex: 1,
      gap: 2,
      paddingVertical: 8,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
      backgroundColor: c.surface,
    },
    typeChipSelected: { borderColor: c.accent, backgroundColor: c.accentSub },
    typeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    typeLabel: { flexShrink: 1, marginTop: -1 },
    stack: { gap: space.lg },
    columns: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.lg, marginHorizontal: -space.sm },
    column: { width: '50%', paddingHorizontal: space.sm },
    more: { alignSelf: 'flex-start', paddingVertical: 6 },
    // Under the header, the screen's width: a failed save or being offline.
    strip: {
      paddingVertical: 10,
      paddingHorizontal: space.gutter,
      backgroundColor: c.warnSoft,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
  });
