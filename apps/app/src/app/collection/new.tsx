import { HeaderTextAction } from '@homelibra/ui/screen-header';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Switch } from '@homelibra/ui/switch';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { DefinitionTags } from '@/features/collection/definition-tags';
import { useTRPC } from '@/lib/trpc';

/**
 * Yeni dosya (#128): the name, the Tags and the source-notes switch, and
 * how many Notes the Collection would gather before it is saved. Nothing is
 * made until Kaydet, so going back leaves no trace; once saved, the new
 * Collection's page takes this screen's place.
 */
export default function NewCollectionScreen() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
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
        router.replace({ pathname: '/collection/[id]', params: { id } });
      },
    }),
  );
  const ready = name.trim().length > 0 && !create.isPending;
  const save = () => ready && create.mutate({ name: name.trim(), tags, includeSourceNotes });
  const counts = tags.length > 0 ? preview.data : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          title: t('collection.newTitle'),
          headerRight: () => <HeaderTextAction label={t('collection.save')} onPress={save} disabled={!ready} />,
        }}
      />
      <ScrollView contentContainerClassName="gap-5 px-lg pt-sm pb-xxl" keyboardShouldPersistTaps="handled">
        <TextField
          label={t('collection.nameField')}
          required
          autoFocus
          value={name}
          onChangeText={setName}
          onSubmitEditing={save}
          placeholder={t('collection.namePlaceholder')}
          returnKeyType="done"
          maxLength={200}
        />
        <View className="gap-1.5">
          <Text variant="fieldLabel">{t('tags.field')}</Text>
          <DefinitionTags names={tags} onChange={setTags} />
          <Text variant="caption">{t('collection.tagsHint')}</Text>
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <Text variant="label" className="shrink">
            {t('collection.sourceNotes')}
            {includeSourceNotes && !!counts?.sourceOnlyCount && (
              <Text variant="label" color="muted">
                {' '}
                {t('collection.sourceNotesCount', { count: counts.sourceOnlyCount })}
              </Text>
            )}
          </Text>
          <Switch label={t('collection.sourceNotes')} value={includeSourceNotes} onChange={setIncludeSourceNotes} />
        </View>
        {tags.length > 0 && (
          <View className="gap-1 border-t border-line-soft pt-3.5">
            <SectionHeading title={t('collection.inCollection')} />
            {counts && (
              <Text variant="body">
                {t('collection.counts', { notes: counts.noteCount, sources: counts.sourceCount })}
              </Text>
            )}
          </View>
        )}
        {create.isError && (
          <Text variant="bodySm" color="danger">
            {t('collection.saveFailed')}
          </Text>
        )}
      </ScrollView>
    </>
  );
}
