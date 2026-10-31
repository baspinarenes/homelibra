import { HeaderTextAction } from '@homelibra/ui/screen-header';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Switch } from '@homelibra/ui/switch';
import { TextField } from '@homelibra/ui/text-field';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DefinitionTags } from '@/components/definition-tags';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Yeni dosya (#128): the name, the Tags and the source-notes switch, and
 * how many Notes the Collection would gather before it is saved. Nothing is
 * made until Kaydet, so going back leaves no trace; once saved, the new
 * Collection's page takes this screen's place.
 */
export default function NewCollectionScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
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
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
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
        <View style={styles.field}>
          <Text style={styles.label}>{t('tags.field').toLocaleUpperCase('tr')}</Text>
          <DefinitionTags names={tags} onChange={setTags} />
          <Text style={styles.hint}>{t('collection.tagsHint')}</Text>
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>
            {t('collection.sourceNotes')}
            {includeSourceNotes && !!counts?.sourceOnlyCount && (
              <Text style={styles.switchCount}>
                {' '}
                {t('collection.sourceNotesCount', { count: counts.sourceOnlyCount })}
              </Text>
            )}
          </Text>
          <Switch label={t('collection.sourceNotes')} value={includeSourceNotes} onChange={setIncludeSourceNotes} />
        </View>
        {tags.length > 0 && (
          <View style={styles.preview}>
            <SectionHeading title={t('collection.inCollection')} />
            {counts && (
              <Text style={styles.counts}>
                {t('collection.counts', { notes: counts.noteCount, sources: counts.sourceCount })}
              </Text>
            )}
          </View>
        )}
        {create.isError && <Text style={styles.error}>{t('collection.saveFailed')}</Text>}
      </ScrollView>
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    form: { gap: 20, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xxl },
    field: { gap: 6 },
    label: { ...typeScale.fieldLabel, color: c.muted },
    hint: { ...typeScale.caption, color: c.muted },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    switchLabel: { ...typeScale.label, color: c.fg, flexShrink: 1 },
    switchCount: { color: c.muted },
    preview: { gap: 4, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.lineSoft },
    counts: { ...typeScale.body, color: c.ink2 },
    error: { ...typeScale.body, fontSize: 14, lineHeight: 20, color: c.danger },
  });
