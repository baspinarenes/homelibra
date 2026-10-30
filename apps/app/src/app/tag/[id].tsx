import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CollectionView, SourceNotesSwitch, ViewCount } from '@/components/collection-view';
import { narrowView, SearchField, useSearchText, useTagSearch } from '@/components/note-search';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * A Tag's page (#51, story 104): the Collection view of that one Tag, saved
 * nowhere; its switch lives on the page, and its search box only narrows
 * what is shown. "Dosya olarak kaydet" makes it a Collection of the same
 * name and Tag and opens that instead.
 */
export default function TagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [includeSourceNotes, setIncludeSourceNotes] = useState(true);
  // The view stays up while the switch's other side loads.
  const view = useQuery({
    ...trpc.collections.tagView.queryOptions({ tagId: id, includeSourceNotes }),
    placeholderData: keepPreviousData,
  });
  const search = useSearchText();
  const searched = useTagSearch(id, includeSourceNotes, search.query);
  const save = useMutation(
    trpc.collections.create.mutationOptions({
      onSuccess: async ({ id: collectionId }) => {
        await queryClient.invalidateQueries({ queryKey: trpc.collections.list.queryKey() });
        router.replace({ pathname: '/collection/[id]', params: { id: collectionId } });
      },
    }),
  );

  if (!view.data) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: '' }} />
        {view.isError ? (
          <Text style={styles.lead}>
            {view.error.data?.code === 'NOT_FOUND' ? t('collection.tagMissing') : t('collection.loadFailed')}
          </Text>
        ) : (
          <ActivityIndicator color={styles.spinner.color} />
        )}
      </View>
    );
  }
  const { tag } = view.data;
  const shown = narrowView(view.data, searched.matches);

  const bar = (
    <>
      <View style={styles.titleRow}>
        <Text style={styles.name}>{tag.name}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => save.mutate({ name: tag.name, tags: [tag.name], includeSourceNotes })}
          disabled={save.isPending}
          hitSlop={8}
          style={({ pressed }) => [(pressed || save.isPending) && styles.pressed]}
        >
          <Text style={styles.save}>{t('collection.saveAsCollection')}</Text>
        </Pressable>
      </View>
      <SourceNotesSwitch
        value={includeSourceNotes}
        count={view.data.sourceOnlyCount}
        onChange={setIncludeSourceNotes}
      />
      <SearchField value={search.text} onChange={search.setText} placeholder={t('noteSearch.inView')} />
      <ViewCount view={shown} of={view.data} />
      {searched.failed && <Text style={styles.error}>{t('noteSearch.failed')}</Text>}
      {save.isError && <Text style={styles.error}>{t('collection.saveFailed')}</Text>}
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <CollectionView
        view={shown}
        bar={bar}
        matches={searched.matches}
        empty={searched.matches ? t('noteSearch.viewEmpty') : t('collection.emptyTagNoNotes')}
      />
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.6 },
    titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.md },
    name: { ...typeScale.title, flexShrink: 1, color: c.fg },
    save: { ...typeScale.button, color: c.accent },
    error: { ...typeScale.caption, color: c.danger },
  });
