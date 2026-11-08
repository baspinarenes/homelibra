import { HeaderTextAction, ScreenHeader } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type NativeStackHeaderProps, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CollectionView, SourceNotesSwitch, ViewCount, ViewName } from '@/components/collection-view';
import { narrowView, SearchField, ShortWords, useSearchText, useTagSearch } from '@/components/note-search';
import { useTRPC } from '@/lib/trpc';

/**
 * A Tag's page (#51, story 104): ETİKET in the header, and under it the
 * Tag's name and the Collection view of that one Tag, saved nowhere; its switch
 * lives on the page, and its search box only narrows what is shown. "Dosya
 * yap" in the header makes it a Collection of the same name, Tag and switch
 * and opens that instead.
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
          <Text variant="body" style={styles.lead}>
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
      <ViewName name={tag.name} />
      <SearchField value={search.text} onChange={search.setText} placeholder={t('noteSearch.inView')} />
      {/* With no match, the words stand under "Eşleşen not yok." instead. */}
      {shown.noteCount > 0 && <ShortWords words={searched.shortWords} />}
      <ViewCount
        view={shown}
        of={view.data}
        aside={
          <SourceNotesSwitch
            value={includeSourceNotes}
            count={view.data.sourceOnlyCount}
            onChange={setIncludeSourceNotes}
          />
        }
      />
      {searched.failed && (
        <Text variant="caption" color="danger">
          {t('noteSearch.failed')}
        </Text>
      )}
      {save.isError && (
        <Text variant="caption" color="danger">
          {t('collection.saveFailed')}
        </Text>
      )}
    </>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: tag.name,
          header: ({ navigation, back }: NativeStackHeaderProps) => (
            <ScreenHeader
              title={t('collection.tagPageTitle')}
              onBack={back ? navigation.goBack : undefined}
              backLabel={t('screenHeader.back')}
              right={
                <HeaderTextAction
                  label={t('collection.saveAsCollection')}
                  accessibilityLabel={t('collection.saveAsCollectionLabel')}
                  onPress={() => save.mutate({ name: tag.name, tags: [tag.name], includeSourceNotes })}
                  disabled={save.isPending}
                />
              }
            />
          ),
        }}
      />
      <CollectionView
        view={shown}
        bar={bar}
        matches={searched.matches}
        underEmpty={searched.matches && <ShortWords words={searched.shortWords} centered />}
        empty={searched.matches ? t('noteSearch.viewEmpty') : t('collection.emptyTagNoNotes')}
      />
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { textAlign: 'center' },
    spinner: { color: c.accent },
  });
