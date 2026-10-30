import type { AppRouter } from '@homelibra/api';
import {
  keptHidden,
  type SourceField,
  sourceFields,
  type SourceIdentifier,
  sourceLayout,
  type SourceType,
  sourceTypes,
  type SourceValues,
} from '@homelibra/core/source';
import { useQueryClient } from '@tanstack/react-query';
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
  TextInput,
  type TextInputProps,
  useWindowDimensions,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { SourceTypeIcon } from '@/components/source-type-icon';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles, wideMinWidth } from '@/theme';

export type SourceDraft = {
  type: SourceType;
  title: string;
  author: string;
  bibliographicNote: string;
  /** ISBN, DOI and the type-specific fields, including the ones the current type hides. */
  values: SourceValues;
};

export const emptyDraft: SourceDraft = { type: 'book', title: '', author: '', bibliographicNote: '', values: {} };

type StoredSource = inferRouterOutputs<AppRouter>['sources']['get'];

export function sourceToDraft(source: StoredSource): SourceDraft {
  return {
    type: source.type,
    title: source.title,
    author: source.author ?? '',
    bibliographicNote: source.bibliographicNote ?? '',
    values: { ...source.fields, isbn: source.isbn ?? '', doi: source.doi ?? '' },
  };
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

/** Every value the form holds, hidden ones included; a blank one empties its field. */
export function draftToInput({ values, ...draft }: SourceDraft) {
  return {
    ...draft,
    isbn: values.isbn ?? '',
    doi: values.doi ?? '',
    fields: Object.fromEntries(sourceFields.map((key) => [key, values[key] ?? ''])) as Record<SourceField, string>,
  };
}

/**
 * The Source form, Sade variant (#18): Tür → ISBN/DOI → Başlık → Yazar →
 * type-specific fields (sparse ones behind a button) → Künye notu. Only Tür
 * and Başlık are required. A type change hides fields and never clears them.
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

  const layout = sourceLayout(draft.type);
  const canSave = draft.title.trim() !== '' && !saving;
  const save = () => canSave && onSave(draft);
  // A new type starts with its sparse fields behind the button again.
  const changeType = (type: SourceType) => {
    setDraft((d) => ({ ...d, type }));
    setTuckedOpen(false);
  };
  const setValue = (key: SourceIdentifier | SourceField, value: string) =>
    setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));

  const tuckedFilled = layout.tucked.filter((key) => draft.values[key]?.trim()).length;
  const kept = keptHidden(draft.type, draft.values);
  const typeText = t(`sourceTypes.${draft.type}`, { returnObjects: true });

  const fieldInput = (key: SourceIdentifier | SourceField, extra?: TextInputProps) => (
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

  const typeFields = [...layout.open, ...(tuckedOpen ? layout.tucked : [])];

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
                    value: draft.values[key]?.trim() ?? '',
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

function Field({
  label,
  required = false,
  serif = false,
  multiline = false,
  ...input
}: { label: string; required?: boolean; serif?: boolean } & TextInputProps) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label.toLocaleUpperCase('tr')}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted2}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          serif && styles.inputSerif,
          multiline && styles.inputMultiline,
          focused && styles.focused,
        ]}
        {...input}
      />
    </View>
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
    required: { color: c.accent },
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
    },
    inputSerif: { fontFamily: typeScale.sourceTitle.fontFamily, fontSize: 19, lineHeight: 24 },
    inputMultiline: { minHeight: 92, textAlignVertical: 'top' },
    // Design system Input: accent border and a 3px accent-soft ring.
    focused: { borderColor: c.accent, outlineColor: c.accentSoft, outlineWidth: 3, outlineStyle: 'solid' },
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
