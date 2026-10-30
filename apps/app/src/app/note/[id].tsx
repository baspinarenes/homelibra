import type { AppRouter } from '@homelibra/api';
import { formatSortValue, locatorSortValue } from '@homelibra/core/note';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DangerAction } from '@/components/danger-action';
import { Field } from '@/components/field';
import { PrimaryButton } from '@/components/primary-button';
import { TagChips } from '@/components/tag-chips';
import { type PickedSource, SourcePicker } from '@/components/source-picker';
import { SourceTypeIcon } from '@/components/source-type-icon';
import { useTRPC } from '@/lib/trpc';
import { offerServerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type StoredNote = inferRouterOutputs<AppRouter>['notes']['get'];

/** The sort value a Locator text gets, as the field shows it; empty when it holds no number. */
const derivedText = (locator: string) => {
  const value = locatorSortValue(locator);
  return value ? formatSortValue(value) : '';
};

/**
 * Notu düzenle, opened from a Note on the Source page. Its Kaynak field
 * moves the Note to another Source on save, and "Notu sil" at its foot
 * deletes it at once; both offer Geri al back on the Source page (#36).
 */
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
  const [tags, setTags] = useState(() => note.tags.map((tag) => tag.name));
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

  const { colors } = useTheme();
  const [pickingSource, setPickingSource] = useState(false);
  // The Source chosen in the Kaynak field; the Note moves there on save.
  const [moveTo, setMoveTo] = useState<PickedSource | null>(null);
  const currentSource = useQuery(trpc.sources.get.queryOptions({ id: note.sourceId }));
  const shownSource = moveTo ?? currentSource.data;

  // Back to the Source page the Note was opened from.
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/source/[id]', params: { id: note.sourceId } });
  };
  // Everywhere a Note shows: its Source's list, Ana sayfa, search.
  const refreshNotes = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.notes.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.search.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.organize.pathKey() }),
    ]);

  const updateNote = useMutation(trpc.notes.update.mutationOptions());
  const moveNote = useMutation(trpc.notes.move.mutationOptions());
  const update = useMutation({
    mutationFn: async (input: Parameters<typeof updateNote.mutateAsync>[0]) => {
      await updateNote.mutateAsync(input);
      return moveTo ? { to: moveTo, ...(await moveNote.mutateAsync({ id: note.id, sourceId: moveTo.id })) } : null;
    },
    onSuccess: async (moved) => {
      await refreshNotes();
      leave();
      if (moved) offerServerUndo(t('deletion.noteMoved', { title: moved.to.title }), moved.undoToken);
    },
  });

  // Notu sil: no question asked, Geri al instead.
  const remove = useMutation(
    trpc.notes.delete.mutationOptions({
      onSuccess: async ({ undoToken }) => {
        leave();
        offerServerUndo(t('deletion.noteDeleted'), undoToken);
        await Promise.all([
          // Not notes.get: the deleted Note would only fail to load while its screen goes.
          queryClient.invalidateQueries({ queryKey: trpc.notes.list.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.search.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.organize.pathKey() }),
        ]);
      },
    }),
  );

  const hasText = excerpt.trim() !== '' || comment.trim() !== '';
  const canSave = hasText && !update.isPending && !remove.isPending;
  const save = () =>
    canSave &&
    update.mutate({
      id: note.id,
      locator,
      excerpt,
      comment,
      tags,
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
        <View style={styles.sourceField}>
          <Text style={styles.label}>{t('deletion.source').toLocaleUpperCase('tr')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('deletion.chooseSource')}
            onPress={() => setPickingSource(true)}
            style={({ pressed }) => [styles.source, pressed && styles.pressed]}
          >
            {shownSource && <SourceTypeIcon type={shownSource.type} color={colors.ink2} />}
            <Text style={styles.sourceTitle} numberOfLines={2}>
              {shownSource?.title ?? ''}
            </Text>
          </Pressable>
        </View>
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
        <View style={styles.tags}>
          <Text style={styles.label}>{t('tags.field').toLocaleUpperCase('tr')}</Text>
          <TagChips names={tags} pickerTitle={t('tags.noteTitle')} onChange={setTags} />
        </View>
        {!hasText && <Text style={styles.error}>{t('noteEdit.needsText')}</Text>}
        {update.isError && <Text style={styles.error}>{t('noteEdit.saveFailed')}</Text>}
        <PrimaryButton label={t('noteEdit.save')} onPress={save} busy={update.isPending} disabled={!canSave} />
        <View style={styles.foot}>
          {remove.isError && <Text style={styles.error}>{t('deletion.deleteFailed')}</Text>}
          <DangerAction
            label={t('deletion.deleteNote')}
            onPress={() => remove.mutate({ id: note.id })}
            busy={remove.isPending}
            disabled={update.isPending}
          />
        </View>
      </View>
      <SourcePicker
        visible={pickingSource}
        currentId={note.sourceId}
        onPick={(picked) => {
          setMoveTo(picked.id === note.sourceId ? null : picked);
          setPickingSource(false);
        }}
        onClose={() => setPickingSource(false)}
      />
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
    tags: { gap: 8 },
    hint: { ...typeScale.caption, color: c.muted },
    link: { ...typeScale.caption, color: c.accent },
    error: { ...typeScale.body, color: c.danger },
    sourceField: { gap: 6 },
    label: { ...typeScale.micro, color: c.muted },
    source: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      minHeight: 46,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      backgroundColor: c.surface,
    },
    sourceTitle: { ...typeScale.sourceTitleSm, flex: 1, color: c.fg },
    pressed: { opacity: 0.7 },
    foot: { gap: space.sm, marginTop: space.lg },
    headerSave: { ...typeScale.button, fontSize: 15, color: c.accent, paddingHorizontal: space.sm },
    inactive: { opacity: 0.45 },
  });
