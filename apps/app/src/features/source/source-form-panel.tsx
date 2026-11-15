import type { AppRouter } from '@homelibra/api';
import { type SourceType, sourceTypes } from '@homelibra/core/source';
import { Button } from '@homelibra/ui/button';
import { Key, Panel } from '@homelibra/ui/panel';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { cx } from '@homelibra/ui/theme';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import type { inferRouterOutputs } from '@trpc/server';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Cover } from '@/features/source/cover';
import { DateInput } from '@/features/source/date-input';
import { IdentifierField } from '@/features/source/identifier-card';
import { IsbnField, type SuggestedCover } from '@/features/source/isbn-suggestion';
import { CoverImage, SourceCover } from '@/features/source/source-cover';
import { type DeleteSourceState, DeleteSourceQuestion, useDeleteSource } from '@/features/source/source-delete';
import { emptyDraft, type SourceDraft, sourceToDraft, withIsbnSuggestion } from '@/features/source/source-draft';
import { KeptHidden, SourceFieldInput, TuckedFields, useSourceForm } from '@/features/source/source-form';
import { useCreateSource, useUpdateSource } from '@/features/source/source-save';
import { coverSizes } from '@/features/source/template-cover';
import { refreshLibrary } from '@/lib/refresh-library';

type StoredSource = inferRouterOutputs<AppRouter>['sources']['get'];

/**
 * Yeni kaynak in the panel beside a wide Kaynaklar's table (#180, Q47).
 * `onSaved` gets the new Source's id once it is saved and the Library
 * refreshed. `active` is false while another screen is in front.
 */
export function NewSourcePanel({
  active,
  onClose,
  onSaved,
}: {
  active: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  const create = useCreateSource(async (id: string) => {
    await refreshLibrary();
    onSaved(id);
  });
  return (
    <SourceFormPanel
      title={t('sourceForm.newTitle')}
      initial={emptyDraft}
      cover={null}
      saving={create.isPending}
      failed={create.isError}
      offlineNotice={t('outbox.addSourceNeedsConnection')}
      onSave={(draft) => create.mutate(draft)}
      onClose={onClose}
      active={active}
    />
  );
}

/**
 * Kaynağı düzenle on a wide Source page, in place of its writing column
 * (#180, Q47), Kaynağı sil beside its ✕. Saved, the page shows the Source
 * as it is now and `onClose` brings the column back.
 */
export function EditSourcePanel({
  source,
  active,
  onClose,
}: {
  source: StoredSource;
  active: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const update = useUpdateSource(source.id, async () => {
    await refreshLibrary();
    onClose();
  });
  const deletion = useDeleteSource({ id: source.id, title: source.title, onFailed: setDeleteFailed });
  // The Source as the form opened on it; what the page refetches after does not move it.
  const [initial] = useState(() => sourceToDraft(source));
  return (
    <SourceFormPanel
      title={t('sourceForm.editTitle')}
      initial={initial}
      cover={source.cover}
      saving={update.isPending}
      failed={update.isError}
      deleteFailed={deleteFailed}
      offlineNotice={t('outbox.editSourceNeedsConnection')}
      onSave={(draft) => update.mutate(draft)}
      onClose={onClose}
      active={active}
      deletion={deletion}
    />
  );
}

/**
 * The Source form as a wide screen's panel has it (Q48–Q50, R6-Final-F):
 * every field's name over it; Tür as buttons side by side, wrapping onto a
 * second line; the ISBN's suggestion right under its field; the Kapak in a
 * small column beside Başlık and the fields under it. The form's rules are
 * the phone's (#18, #65): Tür first, the ISBN or DOI before Başlık, the
 * sparse fields behind "+ …", hidden values kept and named. Vazgeç and
 * Kaydet stand at its foot. ⌘↵ saves; Esc closes it, but first asks
 * "Değişiklikler atılsın mı?" in the foot once something is written, and
 * puts a question it asked away again. Being offline and a failed save are
 * said on a strip at its top.
 */
function SourceFormPanel({
  title,
  initial,
  cover,
  saving,
  failed,
  deleteFailed = false,
  offlineNotice,
  onSave,
  onClose,
  active,
  deletion,
}: {
  title: string;
  initial: SourceDraft;
  /** The Cover the Source has (editing), shown until Open Library's replaces it. */
  cover: Cover | null;
  saving: boolean;
  failed: boolean;
  deleteFailed?: boolean;
  offlineNotice: string;
  onSave: (draft: SourceDraft) => void;
  onClose: () => void;
  active: boolean;
  /** Kaynağı sil, when editing: its question takes the foot. */
  deletion?: DeleteSourceState;
}) {
  const { t } = useTranslation();
  const form = useSourceForm({ initial, saving, onSave });
  const { draft, setDraft, layout, typeFields, typeText } = form;
  const [asking, setAsking] = useState(false);
  const confirmingDelete = deletion?.confirming ?? false;

  useShortcuts({ panelOpen: true, unsavedChanges: form.changed && !asking && !confirmingDelete, active }, (command) => {
    switch (command) {
      case 'submit':
        form.save();
        return true;
      case 'askDiscard':
        setAsking(true);
        return true;
      case 'closePanel':
        // Esc again over a question takes it back, as its own button does.
        if (asking) setAsking(false);
        else if (confirmingDelete) deletion?.cancel();
        else onClose();
        return true;
      default:
        return false;
    }
  });

  // Offline says why Kaydet does nothing; a failed save or delete says to try again.
  const notice = form.offline
    ? offlineNotice
    : failed
      ? t('sourceForm.saveFailed')
      : deleteFailed
        ? t('deletion.deleteFailed')
        : null;

  const foot = confirmingDelete ? (
    <View className="flex-row flex-wrap items-center justify-end gap-sm">
      <Text variant="bodySm" className="mr-auto min-w-0 shrink">
        <DeleteSourceQuestion title={initial.title} count={deletion?.noteCount ?? 0} />
      </Text>
      <Button label={t('deletion.cancel')} variant="secondary" onPress={() => deletion?.cancel()} />
      <Button
        label={t('deletion.confirm')}
        variant="danger"
        onPress={() => deletion?.confirm()}
        busy={deletion?.busy}
      />
    </View>
  ) : asking ? (
    <View className="flex-row flex-wrap items-center justify-end gap-sm">
      <Text variant="label" className="mr-auto">
        {t('sourcePanel.discard')}
      </Text>
      <Button label={t('sourcePanel.keepEditing')} variant="secondary" onPress={() => setAsking(false)} />
      <Button label={t('sourcePanel.discardConfirm')} variant="danger" onPress={onClose} />
    </View>
  ) : (
    <View className="flex-row flex-wrap items-center justify-end gap-sm">
      <View className="mr-auto flex-row items-center gap-md">
        <KeyHint keys="Esc" label={t('sourcePanel.hintCancel')} />
        <KeyHint keys="⌘↵" label={t('sourcePanel.hintSave')} />
      </View>
      <Button label={t('sourcePanel.cancel')} variant="secondary" onPress={onClose} />
      <Button label={t('sourceForm.save')} onPress={form.save} disabled={!form.canSave} busy={saving} />
    </View>
  );

  return (
    <Panel
      label={title}
      head={<Text variant="sourceTitle">{title}</Text>}
      actions={
        deletion && (
          <HeaderIconAction
            icon={Trash}
            tone="danger"
            label={t('deletion.deleteSource')}
            onPress={deletion.ask}
            busy={deletion.busy && !deletion.confirming}
            disabled={deletion.disabled || saving}
          />
        )
      }
      closeLabel={t('widePanel.close')}
      onClose={onClose}
      foot={foot}
    >
      {notice && (
        <View role="alert" className="border-b border-line bg-warn-soft px-xl py-2.5">
          <Text variant="label" color="warn">
            {notice}
          </Text>
        </View>
      )}
      <View className="gap-md px-xl pt-lg">
        <TypeChoice value={draft.type} onChange={form.changeType} />

        {layout.identifier === 'isbn' && (
          <IsbnField
            isbn={draft.values.isbn ?? ''}
            onChangeIsbn={(value) => form.setValue('isbn', value)}
            onAccept={(suggestion, suggested) => setDraft((d) => withIsbnSuggestion(d, suggestion, suggested))}
          />
        )}
        {layout.identifier === 'doi' && (
          <IdentifierField
            label={t('sourceFields.doi')}
            value={draft.values.doi ?? ''}
            onChangeText={(value) => form.setValue('doi', value)}
            placeholder={t('sourceForm.doiPlaceholder')}
            action={form.doi.action}
            hint={form.doi.hint}
            alert={form.doi.failed}
          />
        )}

        <View className="flex-row gap-lg">
          <View className="min-w-0 flex-1 gap-md">
            <TextField
              label={t('sourceForm.title')}
              required
              value={draft.title}
              onChangeText={(value) => setDraft((d) => ({ ...d, title: value }))}
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
            {typeFields.map((key) => (
              <SourceFieldInput key={key} form={form} field={key} />
            ))}
            <TuckedFields form={form} />
            <TextField
              label={t('sourceForm.bibliographicNote')}
              value={draft.bibliographicNote}
              onChangeText={(bibliographicNote) => setDraft((d) => ({ ...d, bibliographicNote }))}
              placeholder={t('sourceForm.bibliographicNoteExample')}
              multiline
            />
          </View>
          <FormCover
            type={draft.type}
            stored={cover}
            suggested={draft.suggestedCover ?? null}
            onDrop={() => setDraft((d) => ({ ...d, suggestedCover: null }))}
          />
        </View>

        <KeptHidden form={form} />
      </View>
    </Panel>
  );
}

/** Tür as buttons side by side, wrapping in the panel; the chosen one filled. */
function TypeChoice({ value, onChange }: { value: SourceType; onChange: (type: SourceType) => void }) {
  const { t } = useTranslation();
  return (
    <View className="gap-1.5">
      <Text variant="fieldLabel">{t('sourceForm.type')}</Text>
      <View role="radiogroup" aria-label={t('sourceForm.type')} className="flex-row flex-wrap gap-1">
        {sourceTypes.map((type) => {
          const selected = type === value;
          return (
            <Pressable
              key={type}
              role="radio"
              aria-checked={selected}
              aria-description={t(`sourceTypes.${type}.scope`)}
              onPress={() => onChange(type)}
              className={cx(
                'rounded-chip border px-2.25 py-1.25 active:opacity-70',
                selected ? 'border-accent bg-accent' : 'border-line bg-surface',
              )}
            >
              <Text variant="labelSm" color={selected ? 'accentFg' : 'ink2'}>
                {t(`sourceTypes.${type}.label`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * The Kapak column beside Başlık: Open Library's cover once Forma aktar
 * took it, said to come on save and droppable again; else the Cover the
 * Source has, or its Tür's template.
 */
function FormCover({
  type,
  stored,
  suggested,
  onDrop,
}: {
  type: SourceType;
  stored: Cover | null;
  suggested: SuggestedCover | null;
  onDrop: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="w-[100px] shrink-0 gap-1.5">
      <Text variant="fieldLabel">{t('sourcePanel.cover')}</Text>
      {suggested ? (
        <>
          <CoverImage file={suggested.cover.large} style={coverSizes.form} />
          <Text variant="captionSm">{t('isbn.coverOnSave')}</Text>
          <Pressable role="button" onPress={onDrop} hitSlop={6} className="self-start active:opacity-70">
            <Text variant="link">{t('isbn.dropCover')}</Text>
          </Pressable>
        </>
      ) : (
        <SourceCover type={type} cover={stored} size="form" />
      )}
    </View>
  );
}

function KeyHint({ keys, label }: { keys: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Key keys={keys} />
      <Text variant="caption">{` ${label}`}</Text>
    </View>
  );
}
