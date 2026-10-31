import { HeaderTextAction, ScreenHeader } from '@homelibra/ui/screen-header';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type NativeStackHeaderProps, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { CollectionView, SourceNotesSwitch, ViewCount } from '@/components/collection-view';
import { narrowView, SearchField, useSearchText, useTagSearch } from '@/components/note-search';
import { useTRPC } from '@/lib/trpc';

/**
 * A Tag's page (#51, story 104): "Etiket: " and its name in the header, and
 * under it the Collection view of that one Tag, saved nowhere; its switch
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
      <Stack.Screen
        options={{
          title: tag.name,
          header: ({ navigation, back }: NativeStackHeaderProps) => (
            <ScreenHeader
              prefix={t('collection.tagTitlePrefix')}
              title={tag.name}
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
    error: { ...typeScale.caption, color: c.danger },
  });
