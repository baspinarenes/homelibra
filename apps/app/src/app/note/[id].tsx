import type { KnownNote } from '@homelibra/outbox';
import { Button } from '@homelibra/ui/button';
import { HeaderTextAction } from '@homelibra/ui/screen-header';
import { TextField } from '@homelibra/ui/text-field';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { useEditedNote, useNoteDraft } from '@/features/note/note-edit';
import { TagChips } from '@/features/tag/tag-chips';
import { SourcePicker } from '@/features/source/source-picker';
import { SourceTypeIcon } from '@/features/source/source-type-icon';

/**
 * Notu düzenle, opened from a Note on the Source page. Its Kaynak field
 * moves the Note to another Source on save, and "Notu sil" at its foot
 * deletes it at once; both offer Geri al back on the Source page (#36).
 * Everything goes through the outbox, so on the phone a Note still waiting
 * to be sent, or one opened offline, is edited just the same (#58).
 */
export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { note, sourceGone, refused, unavailable } = useEditedNote(id);

  if (note) return <NoteForm key={id} note={note} sourceGone={sourceGone} refused={refused} />;
  return (
    <View className="flex-1 items-center justify-center bg-page p-xl">
      {unavailable === 'failed' ? (
        <Text variant="body" className="text-center">
          {t('noteEdit.loadFailed')}
        </Text>
      ) : unavailable === 'offline' ? (
        <Text variant="body" className="text-center">
          {t('outbox.noteNotFound')}
        </Text>
      ) : (
        <ActivityIndicator color={colors.accent} />
      )}
    </View>
  );
}

/**
 * `sourceGone`: its Source was deleted elsewhere while it waited; `refused`:
 * the server refused its text ("gönderilemedi"), and saving sends it again.
 */
function NoteForm({ note, sourceGone, refused }: { note: KnownNote; sourceGone: boolean; refused: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const [pickingSource, setPickingSource] = useState(false);

  // Back to the Source page the Note was opened from.
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/source/[id]', params: { id: note.sourceId } });
  };
  const draft = useNoteDraft(note, sourceGone, leave);
  const { text, shownSource, sourceLost, hasText, canSave, busy, failed, save } = draft;
  const setField = (field: keyof typeof text) => (value: string) => draft.setText({ ...text, [field]: value });

  return (
    <ScrollView
      className="flex-1 bg-page"
      contentContainerClassName="px-lg pt-md pb-xxl"
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{
          title: t('noteEdit.title'),
          headerRight: () => (
            <HeaderTextAction label={t('noteEdit.save')} onPress={save} disabled={!canSave} busy={busy === 'save'} />
          ),
        }}
      />
      <View className="w-full max-w-[640px] gap-lg self-center">
        {refused && (
          <Text variant="body" color="warn">
            {t('outbox.refusedLead')}
          </Text>
        )}
        <View className="gap-1.5">
          <Text variant="fieldLabel">{t('deletion.source')}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('deletion.chooseSource')}
            onPress={() => setPickingSource(true)}
            className="min-h-11.5 flex-row items-center gap-sm rounded-control border border-line bg-surface px-3.5 py-2.5 active:opacity-70"
          >
            {shownSource && <SourceTypeIcon type={shownSource.type} color={colors.ink2} />}
            {/* Kaynağı silinmiş: a new Source sends the Note there. */}
            <Text
              variant={sourceLost ? 'label' : 'sourceTitleSm'}
              color={sourceLost ? 'warn' : undefined}
              className="flex-1"
              numberOfLines={2}
            >
              {shownSource?.title ?? (sourceGone ? t('outbox.chooseNewSource') : '')}
            </Text>
          </Pressable>
        </View>
        <TextField
          label={t('noteEdit.locator')}
          value={text.locator}
          onChangeText={setField('locator')}
          placeholder={t('capture.locatorPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label={t('noteEdit.excerpt')}
          value={text.excerpt}
          onChangeText={setField('excerpt')}
          multiline
          excerpt
        />
        <TextField label={t('noteEdit.comment')} value={text.comment} onChangeText={setField('comment')} multiline />
        <View className="gap-2">
          <Text variant="fieldLabel">{t('tags.field')}</Text>
          <TagChips names={draft.tags} pickerTitle={t('tags.noteTitle')} onChange={draft.setTags} />
        </View>
        {!hasText && (
          <Text variant="body" color="danger">
            {t('noteEdit.needsText')}
          </Text>
        )}
        {failed === 'save' && (
          <Text variant="body" color="danger">
            {t('noteEdit.saveFailed')}
          </Text>
        )}
        <View className="mt-lg gap-sm">
          {failed === 'delete' && (
            <Text variant="body" color="danger">
              {t('deletion.deleteFailed')}
            </Text>
          )}
          <Button
            label={t('deletion.deleteNote')}
            variant="secondary"
            tone="danger"
            block
            onPress={draft.remove}
            busy={busy === 'delete'}
            disabled={busy === 'save'}
          />
        </View>
      </View>
      <SourcePicker
        visible={pickingSource}
        currentId={note.sourceId}
        onPick={(picked) => {
          draft.chooseSource(picked);
          setPickingSource(false);
        }}
        onClose={() => setPickingSource(false)}
      />
    </ScrollView>
  );
}
