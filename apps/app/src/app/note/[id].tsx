import type { AppRouter } from '@homelibra/api';
import { formatSortValue, locatorSortValue } from '@homelibra/core/note';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Field } from '@/components/field';
import { PrimaryButton } from '@/components/primary-button';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type StoredNote = inferRouterOutputs<AppRouter>['notes']['get'];

/** The sort value a Locator text gets, as the field shows it; empty when it holds no number. */
const derivedText = (locator: string) => {
  const value = locatorSortValue(locator);
  return value ? formatSortValue(value) : '';
};

/** Notu düzenle, opened from a Note on the Source page. */
export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const note = useQuery(trpc.notes.get.queryOptions({ id }));

  if (note.isPending || note.isError) {
    return (
      <View style={styles.center}>
        {note.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : (
          <Text style={styles.lead}>{t('noteEdit.loadFailed')}</Text>
        )}
      </View>
    );
  }
  return <NoteForm key={id} note={note.data} />;
}

function NoteForm({ note }: { note: StoredNote }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [locator, setLocator] = useState(note.locator ?? '');
  const [excerpt, setExcerpt] = useState(note.excerpt ?? '');
  const [comment, setComment] = useState(note.comment ?? '');
  // The sort value the scholar typed here; until then the field shows the
  // stored one, and the derived one once the Locator text changes (#2 §5).
  const [typedSort, setTypedSort] = useState<string | null>(null);
  const stored = note.locatorSort ? formatSortValue(note.locatorSort) : '';
  const locatorChanged = locator.trim() !== (note.locator ?? '');
  const sortText = typedSort ?? (locatorChanged ? derivedText(locator) : stored);
  // A value without numbers is derived again on save, so it is no correction.
  const sortValue = locatorSortValue(sortText);
  const corrected =
    locator.trim() !== '' && sortValue !== null && sortValue.join() !== locatorSortValue(locator)?.join();

  const update = useMutation(
    trpc.notes.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.notes.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.sources.lastNoted.queryKey() }),
        ]);
        if (router.canGoBack()) router.back();
        else router.replace({ pathname: '/source/[id]', params: { id: note.sourceId } });
      },
    }),
  );

  const hasText = excerpt.trim() !== '' || comment.trim() !== '';
  const canSave = hasText && !update.isPending;
  const save = () =>
    canSave &&
    update.mutate({
      id: note.id,
      locator,
      excerpt,
      comment,
      // Sent only when typed here: a value without numbers derives it again.
      ...(typedSort !== null && { locatorSort: locatorSortValue(typedSort) }),
    });

  const sortHint = !locator.trim()
    ? t('noteEdit.noLocator')
    : corrected
      ? t('noteEdit.corrected')
      : sortText
        ? t('noteEdit.derived')
        : t('noteEdit.unsortable');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: t('noteEdit.title'),
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={save} disabled={!canSave} hitSlop={8}>
              <Text style={[styles.headerSave, !canSave && styles.inactive]}>{t('noteEdit.save')}</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.form}>
        <Field
          label={t('noteEdit.locator')}
          value={locator}
          onChangeText={(text) => {
            setLocator(text);
            // A new Locator text derives its sort value again; correct it after.
            setTypedSort(null);
          }}
          placeholder={t('capture.locatorPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.sort}>
          <Field
            label={t('noteEdit.locatorSort')}
            value={sortText}
            onChangeText={setTypedSort}
            editable={locator.trim() !== ''}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            {sortHint}
            {corrected && (
              <Text accessibilityRole="button" onPress={() => setTypedSort(derivedText(locator))} style={styles.link}>
                {` ${t('noteEdit.rederive')}`}
              </Text>
            )}
          </Text>
        </View>
        <Field label={t('noteEdit.excerpt')} value={excerpt} onChangeText={setExcerpt} multiline quote />
        <Field label={t('noteEdit.comment')} value={comment} onChangeText={setComment} multiline />
        {!hasText && <Text style={styles.error}>{t('noteEdit.needsText')}</Text>}
        {update.isError && <Text style={styles.error}>{t('noteEdit.saveFailed')}</Text>}
        <PrimaryButton label={t('noteEdit.save')} onPress={save} busy={update.isPending} disabled={!canSave} />
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    form: { gap: space.lg, width: '100%', maxWidth: 640, alignSelf: 'center' },
    sort: { gap: 6 },
    hint: { ...typeScale.caption, color: c.muted },
    link: { ...typeScale.caption, color: c.accent },
    error: { ...typeScale.body, color: c.danger },
    headerSave: { ...typeScale.button, fontSize: 15, color: c.accent, paddingHorizontal: space.sm },
    inactive: { opacity: 0.45 },
  });
