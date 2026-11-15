import type { KnownNote } from '@homelibra/outbox';
import { Button } from '@homelibra/ui/button';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { NoteEditor, noteEditAction } from '@homelibra/ui/note-editor';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import { useIsFocused } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { type EditEnd, useEditedNote, useNoteDraft } from '@/features/note/note-edit';
import { SourceChoice } from '@/features/source/source-picker';
import { SourceTypeIcon } from '@/features/source/source-type-icon';
import { TagEditor } from '@/features/tag/tag-picker';
import { useUnsavedWork } from '@/components/wide-frame';

/**
 * The Note `id` edited where it is open on a wide screen (#176, ADR-0012):
 * in the panel beside a list of Notes, in a Source page's column. Kaynak,
 * Konum, Alıntı, Yorum and the Tags, in place, no sheet. ⌘↵ saves; Esc
 * closes an open choice, then the edit, asking "Değişiklikler atılsın mı?"
 * first when it holds changes. The Kaynak field moves the Note on save,
 * Notu sil deletes it, both with Geri al, all through the outbox, as on the
 * phone's Notu düzenle (#36, #58).
 *
 * `onEnd` takes the edit away: saved (and where the Note is now), deleted,
 * or null, put away unsaved. It hears ⌘↵ and Esc itself while its screen
 * is in front; the screen hears no keys of its own meanwhile. `aside`
 * stands beside its title.
 */
export function NoteEditInPlace({
  id,
  onEnd,
  aside,
}: {
  id: string;
  onEnd: (end: EditEnd | null) => void;
  aside?: ReactNode;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const active = useIsFocused();
  const { note, sourceGone, refused, unavailable } = useEditedNote(id);
  // Until the Note is here, Esc puts the edit away.
  useShortcuts({ panelOpen: true, active: active && !note }, (command) => {
    if (command !== 'closePanel' && command !== 'back') return false;
    onEnd(null);
    return true;
  });

  if (note)
    return (
      <EditForm
        key={id}
        note={note}
        sourceGone={sourceGone}
        refused={refused}
        onEnd={onEnd}
        aside={aside}
        active={active}
      />
    );
  return (
    <View className="items-center px-gutter py-xl">
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

function EditForm({
  note,
  sourceGone,
  refused,
  onEnd,
  aside,
  active,
}: {
  note: KnownNote;
  sourceGone: boolean;
  refused: boolean;
  onEnd: (end: EditEnd | null) => void;
  aside?: ReactNode;
  active: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const draft = useNoteDraft(note, sourceGone, onEnd);
  // The Kaynak list or the Tag search, open in place.
  const [choosing, setChoosing] = useState<'source' | 'tags' | null>(null);
  const [asking, setAsking] = useState(false);
  const putAway = () => onEnd(null);

  // Changed, the edit holds Not al: its sidebar button puts nothing away unasked (#178).
  useUnsavedWork(draft.changed);
  useShortcuts({ panelOpen: true, unsavedChanges: draft.changed, active }, (command) => {
    switch (noteEditAction(command, { choosing: choosing !== null, asking, canSave: draft.canSave })) {
      case 'save':
        draft.save();
        return true;
      case 'ask':
        setAsking(true);
        return true;
      case 'keepEditing':
        setAsking(false);
        return true;
      case 'closeChoice':
        setChoosing(null);
        return true;
      case 'close':
        putAway();
        return true;
      case 'stay':
        return true;
      default:
        return false;
    }
  });

  const { shownSource, sourceLost } = draft;
  const source = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('deletion.chooseSource')}
        aria-expanded={choosing === 'source'}
        onPress={() => setChoosing(choosing === 'source' ? null : 'source')}
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
        <Text variant="caption">{choosing === 'source' ? '▴' : '▾'}</Text>
      </Pressable>
      {choosing === 'source' && (
        <SourceChoice
          currentId={note.sourceId}
          onPick={(picked) => {
            draft.chooseSource(picked);
            setChoosing(null);
          }}
        />
      )}
    </>
  );

  const tags =
    choosing === 'tags' ? (
      <View className="gap-sm">
        <TagEditor chosen={draft.tags} onChange={draft.setTags} />
        <Button label={t('wideNoteEdit.tagsDone')} variant="small" onPress={() => setChoosing(null)} />
      </View>
    ) : (
      <ChipRow>
        {draft.tags.map((name) => (
          <Chip key={name} label={name} onPress={() => setChoosing('tags')} />
        ))}
        <Chip label={t('tags.add')} tone="add" onPress={() => setChoosing('tags')} />
      </ChipRow>
    );

  const error =
    draft.failed === 'save'
      ? t('noteEdit.saveFailed')
      : draft.failed === 'delete'
        ? t('deletion.deleteFailed')
        : draft.hasText
          ? undefined
          : t('noteEdit.needsText');

  return (
    <NoteEditor
      text={draft.text}
      onTextChange={draft.setText}
      source={source}
      tags={tags}
      aside={aside}
      lead={refused ? t('outbox.refusedLead') : undefined}
      error={error}
      asking={asking}
      canSave={draft.canSave}
      saving={draft.busy === 'save'}
      deleting={draft.busy === 'delete'}
      onSave={draft.save}
      onCancel={() => (draft.changed ? setAsking(true) : putAway())}
      onDiscard={putAway}
      onKeepEditing={() => setAsking(false)}
      onDelete={draft.remove}
      labels={{
        title: t('noteEdit.title'),
        source: t('deletion.source'),
        locator: t('noteEdit.locator'),
        locatorPlaceholder: t('capture.locatorPlaceholder'),
        excerpt: t('noteEdit.excerpt'),
        comment: t('noteEdit.comment'),
        cancel: t('wideNoteEdit.cancel'),
        save: t('noteEdit.save'),
        ask: t('wideNoteEdit.ask'),
        discard: t('wideNoteEdit.discard'),
        keepEditing: t('wideNoteEdit.keepEditing'),
        deleteNote: t('deletion.deleteNote'),
      }}
    />
  );
}
