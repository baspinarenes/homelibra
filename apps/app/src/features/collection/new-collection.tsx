import { Button } from '@homelibra/ui/button';
import { Key, Panel } from '@homelibra/ui/panel';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Switch } from '@homelibra/ui/switch';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useUnsavedWork } from '@/components/wide-frame';
import { DefinitionTags } from '@/features/collection/definition-tags';
import { useTRPC } from '@/lib/trpc';

/**
 * Yeni dosya (#128) as it is being written: the name, the Tags and the
 * source-notes switch, how many Notes the Collection would gather, and
 * `save`, after which `onSaved` gets the new Collection's id. Nothing is
 * made until then, so leaving leaves no trace.
 */
export function useNewCollection({ onSaved }: { onSaved: (id: string) => void }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [includeSourceNotes, setIncludeSourceNotes] = useState(true);
  // The counts stay up while the next Tags or the switch's other side load.
  const preview = useQuery({
    ...trpc.collections.preview.queryOptions({ tags, includeSourceNotes }),
    enabled: tags.length > 0,
    placeholderData: keepPreviousData,
  });
  const create = useMutation(
    trpc.collections.create.mutationOptions({
      onSuccess: async ({ id }) => {
        // Dizin lists it; a Tag written in the picker is new to Etiketler.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.collections.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
        ]);
        onSaved(id);
      },
    }),
  );
  const ready = name.trim().length > 0 && !create.isPending;
  return {
    name,
    setName,
    tags,
    setTags,
    includeSourceNotes,
    setIncludeSourceNotes,
    counts: tags.length > 0 ? preview.data : undefined,
    ready,
    busy: create.isPending,
    failed: create.isError,
    /** Something was written or chosen that leaving would throw away. */
    changed: name.trim().length > 0 || tags.length > 0 || !includeSourceNotes,
    save: () => {
      if (ready) create.mutate({ name: name.trim(), tags, includeSourceNotes });
    },
  };
}

export type NewCollection = ReturnType<typeof useNewCollection>;

/** Yeni dosya's fields, the same on a phone's page and in a wide Dizin's panel. */
export function NewCollectionFields({ form }: { form: NewCollection }) {
  const { t } = useTranslation();
  const { counts } = form;
  return (
    <>
      <TextField
        label={t('collection.nameField')}
        required
        autoFocus
        value={form.name}
        onChangeText={form.setName}
        onSubmitEditing={form.save}
        placeholder={t('collection.namePlaceholder')}
        returnKeyType="done"
        maxLength={200}
      />
      <View className="gap-1.5">
        <Text variant="fieldLabel">{t('tags.field')}</Text>
        <DefinitionTags names={form.tags} onChange={form.setTags} />
        <Text variant="caption">{t('collection.tagsHint')}</Text>
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="label" className="shrink">
          {t('collection.sourceNotes')}
          {form.includeSourceNotes && !!counts?.sourceOnlyCount && (
            <Text variant="label" color="muted">
              {' '}
              {t('collection.sourceNotesCount', { count: counts.sourceOnlyCount })}
            </Text>
          )}
        </Text>
        <Switch
          label={t('collection.sourceNotes')}
          value={form.includeSourceNotes}
          onChange={form.setIncludeSourceNotes}
        />
      </View>
      {form.tags.length > 0 && (
        <View className="gap-1 border-t border-line-soft pt-3.5">
          <SectionHeading title={t('collection.inCollection')} />
          {counts && (
            <Text variant="body">
              {t('collection.counts', { notes: counts.noteCount, sources: counts.sourceCount })}
            </Text>
          )}
        </View>
      )}
      {form.failed && (
        <Text variant="bodySm" color="danger">
          {t('collection.saveFailed')}
        </Text>
      )}
    </>
  );
}

/**
 * Yeni dosya in the panel beside a wide Dizin (#181), as the Kaynak form
 * opens beside Kaynaklar (Q58): the same fields, Vazgeç and Kaydet at its
 * foot. ⌘↵ saves; Esc closes it, but first asks "Değişiklikler atılsın
 * mı?" in the foot once something is written. `active` is false while
 * another screen is in front of Dizin.
 */
export function NewCollectionPanel({
  active,
  onClose,
  onSaved,
}: {
  active: boolean;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  const form = useNewCollection({ onSaved });
  const [asking, setAsking] = useState(false);
  // Half filled, the form holds Not al: neither N nor its sidebar button puts it away unasked (#178).
  useUnsavedWork(form.changed);

  useShortcuts({ panelOpen: true, unsavedChanges: form.changed && !asking, active }, (command) => {
    switch (command) {
      case 'submit':
        form.save();
        return true;
      case 'askDiscard':
        setAsking(true);
        return true;
      case 'closePanel':
        // Esc again over the question takes it back, as "Düzenlemeye dön" does.
        if (asking) setAsking(false);
        else onClose();
        return true;
      default:
        return false;
    }
  });

  const foot = asking ? (
    <View className="flex-row flex-wrap items-center justify-end gap-sm">
      <Text variant="label" className="mr-auto">
        {t('newCollectionPanel.discard')}
      </Text>
      <Button label={t('newCollectionPanel.keepEditing')} variant="secondary" onPress={() => setAsking(false)} />
      <Button label={t('newCollectionPanel.discardConfirm')} variant="danger" onPress={onClose} />
    </View>
  ) : (
    <View className="flex-row flex-wrap items-center justify-end gap-sm">
      <View className="mr-auto flex-row items-center gap-md">
        <KeyHint keys="Esc" label={t('newCollectionPanel.hintCancel')} />
        <KeyHint keys="⌘↵" label={t('newCollectionPanel.hintSave')} />
      </View>
      <Button label={t('collection.cancel')} variant="secondary" onPress={onClose} />
      <Button label={t('collection.save')} onPress={form.save} disabled={!form.ready} busy={form.busy} />
    </View>
  );

  return (
    <Panel
      label={t('collection.newTitle')}
      head={<Text variant="sourceTitle">{t('collection.newTitle')}</Text>}
      closeLabel={t('widePanel.close')}
      onClose={onClose}
      foot={foot}
    >
      <View className="gap-5 px-xl pt-lg">
        <NewCollectionFields form={form} />
      </View>
    </Panel>
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
