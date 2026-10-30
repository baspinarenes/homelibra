import type { AppRouter } from '@homelibra/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CollectionView, SourceNotesSwitch, ViewCount } from '@/components/collection-view';
import { DefinitionTags } from '@/components/definition-tags';
import { NameInput } from '@/components/name-input';
import { narrowView, SearchField, useCollectionSearch, useSearchText } from '@/components/note-search';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type Collection = inferRouterOutputs<AppRouter>['collections']['view'];

/**
 * A Collection (#51): its name, its Tags as chips, the source-notes switch
 * and the count in a fixed bar, its Notes by Source under it. Every change
 * in the bar is kept in the definition, apart from the search box, which
 * only narrows what is shown. The Markdown copy arrives in #52; it takes
 * the Notes shown (`shown`), so only the matches while searching.
 */
export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const view = useQuery(trpc.collections.view.queryOptions({ id }));

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      {view.data ? (
        <CollectionPage collection={view.data} />
      ) : (
        <View style={styles.center}>
          {view.isError ? (
            <Text style={styles.lead}>{t('collection.loadFailed')}</Text>
          ) : (
            <ActivityIndicator color={styles.spinner.color} />
          )}
        </View>
      )}
    </>
  );
}

function CollectionPage({ collection }: { collection: Collection }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [renaming, setRenaming] = useState(false);
  // The definition changes the view, the Dosyalar list and, for new Tags, Etiketler.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.collections.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
    ]);
  const rename = useMutation(
    trpc.collections.rename.mutationOptions({
      onSuccess: () => {
        setRenaming(false);
        return refresh();
      },
    }),
  );
  const setTags = useMutation(trpc.collections.setTags.mutationOptions({ onSuccess: refresh }));
  const setSwitch = useMutation(trpc.collections.setIncludeSourceNotes.mutationOptions({ onSuccess: refresh }));
  const failed = rename.isError || setTags.isError || setSwitch.isError;
  const search = useSearchText();
  const searched = useCollectionSearch(collection.id, search.query);
  const shown = narrowView(collection, searched.matches);

  // While saving, the bar shows what was chosen.
  const tagNames = setTags.isPending ? setTags.variables.names : collection.tags.map((tag) => tag.name);
  const includeSourceNotes = setSwitch.isPending
    ? setSwitch.variables.includeSourceNotes
    : collection.includeSourceNotes;

  const bar = (
    <>
      {renaming ? (
        <NameInput
          initial={collection.name}
          confirmLabel={t('collection.save')}
          busy={rename.isPending}
          onConfirm={(name) => rename.mutate({ id: collection.id, name })}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={t('collection.rename')}
          onPress={() => setRenaming(true)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.name}>{collection.name}</Text>
        </Pressable>
      )}
      <DefinitionTags names={tagNames} onChange={(names) => setTags.mutate({ id: collection.id, names })} />
      <SourceNotesSwitch
        value={includeSourceNotes}
        count={collection.sourceOnlyCount}
        onChange={(value) => setSwitch.mutate({ id: collection.id, includeSourceNotes: value })}
      />
      <SearchField value={search.text} onChange={search.setText} placeholder={t('noteSearch.inView')} />
      <ViewCount view={shown} of={collection} />
      {searched.failed && <Text style={styles.error}>{t('noteSearch.failed')}</Text>}
      {failed && <Text style={styles.error}>{t('collection.saveFailed')}</Text>}
    </>
  );

  return (
    <CollectionView
      view={shown}
      bar={bar}
      matches={searched.matches}
      empty={
        searched.matches
          ? t('noteSearch.viewEmpty')
          : collection.tags.length === 0
            ? t('collection.emptyNoTags')
            : t('collection.emptyNoNotes')
      }
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    name: { ...typeScale.title, color: c.fg },
    error: { ...typeScale.caption, color: c.danger },
  });
