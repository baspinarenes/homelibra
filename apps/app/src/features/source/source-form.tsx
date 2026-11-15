import { formatDate } from '@homelibra/core/date';
import {
  isFilled,
  isSourceDateField,
  keptHidden,
  normalizeDoi,
  normalizeIsbn,
  type SourceDateField,
  type SourceField,
  type SourceIdentifier,
  sourceLayout,
  type SourceTextField,
  type SourceType,
  sourceTypes,
} from '@homelibra/core/source';
import { HeaderIconAction, HeaderTextAction } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { cx, space, useTheme } from '@homelibra/ui/theme';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import Link from 'lucide-react-native/icons/link';
import Save from 'lucide-react-native/icons/save';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type DateDraft, readDateDraft } from '@/features/source/date-draft';
import { DateInput } from '@/features/source/date-input';
import { IdentifierCard } from '@/features/source/identifier-card';
import { IsbnCard } from '@/features/source/isbn-suggestion';
import { filledDates, type SourceDraft, withDoiFill, withIsbnSuggestion } from '@/features/source/source-draft';
import { SourceTypeIcon } from '@/features/source/source-type-icon';
import { useOffline } from '@/lib/network';
import { refreshLibrary } from '@/lib/refresh-library';
import { useTRPC } from '@/lib/trpc';

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
 * The Source form, Sade variant (#18): Tür → the ISBN/DOI card → Başlık →
 * Yazar → Tarih → type-specific fields (sparse ones behind a button) → Ek
 * bilgi. Only Tür and Başlık are required. A type change hides fields and
 * never clears them. Kaydet is only in the header (#120), an icon when
 * Kaynağı sil stands beside it; a failed save and being offline are said on
 * a strip under it.
 */
export function SourceForm({
  screenTitle,
  initial,
  saving,
  failed,
  deleteFailed = false,
  offlineNotice,
  onSave,
  deleteAction,
}: {
  screenTitle: string;
  initial: SourceDraft;
  saving: boolean;
  failed: boolean;
  /** Kaynağı sil did not go through; said on the same strip. */
  deleteFailed?: boolean;
  /** Why Kaydet does nothing offline: saving a Source is online only (#58). */
  offlineNotice: string;
  onSave: (draft: SourceDraft) => void;
  /** In the header, before Kaydet: Kaynağı sil when editing. */
  deleteAction?: ReactNode;
}) {
  const { t } = useTranslation();
  // Two columns from the rail tier up; the wide tier keeps them until the form moves into a panel.
  const wide = useWideLayout().tier !== 'phone';
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

  // Offline says why Kaydet does nothing; a failed save or delete says to try again.
  const notice = offline
    ? offlineNotice
    : failed
      ? t('sourceForm.saveFailed')
      : deleteFailed
        ? t('deletion.deleteFailed')
        : null;
  const saveAction = { label: t('sourceForm.save'), onPress: save, disabled: !canSave, busy: saving };

  return (
    <FormScreen notice={notice}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerRight: () =>
            deleteAction ? (
              <>
                {deleteAction}
                <HeaderIconAction icon={Save} {...saveAction} />
              </>
            ) : (
              <HeaderTextAction {...saveAction} />
            ),
        }}
      />
      <View className={cx('gap-lg', wide && 'w-full max-w-[860px] self-center')}>
        <View className="gap-1.5">
          <Text variant="micro">{t('sourceForm.type')}</Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('sourceForm.type')}
            className="-mx-0.75 flex-row flex-wrap"
          >
            {sourceTypes.map((type) => (
              <View key={type} className={cx('p-0.75', wide ? 'w-[20%]' : 'w-[33.333%]')}>
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
          <View className={wide ? '-mx-sm flex-row flex-wrap gap-y-lg' : 'gap-lg'}>
            {typeFields.map((key) => (
              <View key={key} className={wide ? 'w-[50%] px-sm' : undefined}>
                {fieldInput(key)}
              </View>
            ))}
          </View>
        )}

        {!tuckedOpen && layout.tucked.length > 0 && (
          <Pressable accessibilityRole="button" onPress={() => setTuckedOpen(true)} className="self-start py-1.5">
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
      </View>
    </FormScreen>
  );
}

/** The form's screen: the strip under the header, when there is something to say, and the form scrolling below it. */
function FormScreen({ notice, children }: { notice: string | null; children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-page">
      {notice && (
        // Under the header, the screen's width: a failed save or being offline.
        <View role="alert" className="border-b border-line bg-warn-soft px-gutter py-2.5">
          <Text variant="label" color="warn">
            {notice}
          </Text>
        </View>
      )}
      {/* The form's end clears the phone's navigation bar. */}
      <ScrollView
        className="flex-1 bg-page"
        contentContainerClassName="px-lg pt-md"
        contentContainerStyle={{ paddingBottom: bottom + space.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

function TypeChip({ type, selected, onPress }: { type: SourceType; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      onPress={onPress}
      className={cx(
        'flex-1 gap-0.5 rounded-control border px-2.25 py-2',
        selected ? 'border-accent bg-accent-sub' : 'border-line bg-surface',
      )}
    >
      <View className="flex-row items-start gap-1.5">
        <SourceTypeIcon type={type} color={selected ? colors.accent : colors.ink2} />
        {/* Wraps on a phone rather than cutting "Süreli yayın" short. */}
        <Text variant="label" color={selected ? 'accent' : 'fg'} className="-mt-0.25 shrink">
          {t(`sourceTypes.${type}.label`)}
        </Text>
      </View>
      <Text variant="captionSm">{t(`sourceTypes.${type}.scope`)}</Text>
    </Pressable>
  );
}
