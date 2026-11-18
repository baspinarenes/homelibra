import type { AppRouter } from '@homelibra/api';
import { Button } from '@homelibra/ui/button';
import { type MenuItem, MoreMenu } from '@homelibra/ui/menu';
import { PanelLayout } from '@homelibra/ui/panel';
import { HeaderIconAction, HeaderTextAction, ScreenHeader } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { type NativeStackHeaderProps, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Copy from 'lucide-react-native/icons/copy';
import Search from 'lucide-react-native/icons/search';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, type TextInputInstance, View } from 'react-native';

import { useCopyMarkdown } from '@/features/collection/collection-actions';
import { CollectionView, SourceNotesSwitch, ViewCount, ViewName } from '@/features/collection/collection-view';
import { UndoBarEdge, useViewPanel, WideSearchNotes } from '@/features/collection/view-panel';
import { narrowView, SearchField, ShortWords, useSearchText, useTagSearch } from '@/features/search/note-search';
import { useLeave } from '@/components/wide-frame';
import { useTRPC } from '@/lib/trpc';

type TagView = inferRouterOutputs<AppRouter>['collections']['tagView'];

/**
 * A Tag's page (#51, story 104): ETİKET in the header, and under it the
 * Tag's name and the Collection view of that one Tag, saved nowhere; its switch
 * lives on the page, and its search box only narrows what is shown. "Dosya
 * yap" in the header makes it a Collection of the same name, Tag and switch
 * and opens that instead.
 *
 * On a wide screen (#173) it takes the Collection's wide layout: no header,
 * "‹ Dizin · Etiketler" over the list's own head with the magnifier, Dosya
 * yap and ⋯ (Markdown olarak kopyala ⌘⇧C), full rows in a centred column,
 * and a Note opening in the panel beside them. The search waits behind the
 * magnifier or /, and opens as a Collection's does: its box with Bulunanları
 * kopyala, under them the name and "3 / 15 not · 3 kaynak". The keys are the
 * Collection's: Esc closes the panel, then the search, and never leaves the page.
 */
export default function TagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const trpc = useTRPC();
  const [includeSourceNotes, setIncludeSourceNotes] = useState(true);
  // The view stays up while the switch's other side loads.
  const view = useQuery({
    ...trpc.collections.tagView.queryOptions({ tagId: id, includeSourceNotes }),
    placeholderData: keepPreviousData,
  });

  if (!view.data) {
    return (
      <View className="flex-1 items-center justify-center bg-page p-xl">
        <Stack.Screen options={{ title: '' }} />
        {view.isError ? (
          <Text variant="body" className="text-center">
            {view.error.data?.code === 'NOT_FOUND' ? t('collection.tagMissing') : t('collection.loadFailed')}
          </Text>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  }
  return (
    <TagPage view={view.data} includeSourceNotes={includeSourceNotes} onIncludeSourceNotes={setIncludeSourceNotes} />
  );
}

function TagPage({
  view,
  includeSourceNotes,
  onIncludeSourceNotes,
}: {
  view: TagView;
  includeSourceNotes: boolean;
  onIncludeSourceNotes: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tag } = view;
  const save = useMutation(
    trpc.collections.create.mutationOptions({
      onSuccess: async ({ id: collectionId }) => {
        await queryClient.invalidateQueries({ queryKey: trpc.collections.list.queryKey() });
        router.replace({ pathname: '/collection/[id]', params: { id: collectionId } });
      },
    }),
  );
  const makeCollection = () => save.mutate({ name: tag.name, tags: [tag.name], includeSourceNotes });

  const [menuOpen, setMenuOpen] = useState(false);
  // On the phone the box is always there; on a wide screen it waits behind the magnifier or /.
  const [searching, setSearching] = useState(false);
  const search = useSearchText();
  const searchWaits = useWideLayout().tier === 'wide' && !searching;
  const searched = useTagSearch(tag.id, includeSourceNotes, searchWaits ? '' : search.query);
  const shown = narrowView(view, searched.matches);
  const searchField = useRef<TextInputInstance>(null);
  const closeSearch = () => {
    setSearching(false);
    search.setText('');
  };

  const copyAll = useCopyMarkdown({ ...shown, name: tag.name });
  const { layout, wide, panelOpen, wideList, panel, foot } = useViewPanel({
    view,
    shown,
    found: searched.matches !== null,
    searching,
    menuOpen,
    copyAll: copyAll.copy,
    // Open already: the cursor goes back to the box (a new box takes it as it opens).
    onSearchHere: () => (searching ? searchField.current?.focus() : setSearching(true)),
    onCloseSearch: closeSearch,
  });
  // Back to Dizin over an edit with changes asks first.
  const leave = useLeave();

  const counts = (
    <>
      {/* With no match, the words stand under "Eşleşen not yok." instead. */}
      {shown.noteCount > 0 && <ShortWords words={searched.shortWords} />}
      <ViewCount
        view={shown}
        of={view}
        aside={
          <SourceNotesSwitch value={includeSourceNotes} count={view.sourceOnlyCount} onChange={onIncludeSourceNotes} />
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

  const bar = (
    <>
      <ViewName name={tag.name} />
      <SearchField value={search.text} onChange={search.setText} placeholder={t('noteSearch.inView')} />
      {counts}
    </>
  );

  // The wide head (R4-Tag): back to Dizin's Etiketler, and the magnifier, Dosya yap and ⋯ beside it.
  const menuItems: MenuItem[] = [
    { label: t('collectionActions.copy'), keys: '⌘⇧C', onPress: copyAll.copy, disabled: copyAll.count === 0 },
  ];
  const actions = (
    <View className="flex-row items-center gap-xs">
      {!searching && (
        <HeaderIconAction icon={Search} label={t('noteSearch.inView')} onPress={() => setSearching(true)} />
      )}
      <Button label={t('collection.saveAsCollection')} variant="small" onPress={makeCollection} busy={save.isPending} />
      <MoreMenu label={t('widePanel.more')} items={menuItems} open={menuOpen} onOpenChange={setMenuOpen} />
    </View>
  );
  // Only what the search found, never the whole page while the box is empty or the first answer is on its way.
  const found = searched.matches !== null && shown.noteCount > 0;
  // Under the wide search's name and count, which stand on one line.
  const wideSearchNotes = (
    <WideSearchNotes
      shortWords={searched.shortWords}
      noteCount={shown.noteCount}
      searchFailed={searched.failed}
      saveFailed={save.isError}
    />
  );
  const crumb = (
    <Pressable
      role="button"
      aria-label={t('collection.tagCrumbLabel')}
      onPress={() => leave(() => router.dismissTo({ pathname: '/collections', params: { view: 'tags' } }))}
      className="min-w-0 flex-1 self-center active:opacity-70"
    >
      <Text variant="caption" color="accent" numberOfLines={1}>
        {t('collection.tagCrumb')}
      </Text>
    </Pressable>
  );
  const wideBar = (
    <>
      <View className="flex-row items-center gap-sm">
        {crumb}
        {actions}
      </View>
      {searching ? (
        <>
          {/* As a Collection's (#172): the box with Bulunanları kopyala, then the name and the count. */}
          <View className="flex-row items-center gap-sm">
            <View className="min-w-0 flex-1">
              <SearchField
                look="frame"
                inputRef={searchField}
                value={search.text}
                onChange={search.setText}
                placeholder={t('noteSearch.inView')}
                autoFocus
                onClose={closeSearch}
              />
            </View>
            <Button
              label={t('noteSearch.copyFound')}
              variant="small"
              icon={Copy}
              onPress={copyAll.copy}
              disabled={!found}
            />
          </View>
          <View className="flex-row items-baseline justify-between gap-md">
            <Text variant="sourceTitleSm" numberOfLines={1} className="min-w-0 flex-1">
              {tag.name}
            </Text>
            <ViewCount view={shown} of={view} />
          </View>
          {wideSearchNotes}
        </>
      ) : (
        <>
          {!panelOpen && (
            <Text variant="micro" color="accent">
              {t('collection.tagPageTitle')}
            </Text>
          )}
          <ViewName name={tag.name} />
          {counts}
        </>
      )}
    </>
  );

  const list = (
    <CollectionView
      view={shown}
      bar={wide ? wideBar : bar}
      matches={searched.matches}
      underEmpty={searched.matches && <ShortWords words={searched.shortWords} centered />}
      empty={searched.matches ? t('noteSearch.viewEmpty') : t('collection.emptyTagNoNotes')}
      wide={wideList}
      foot={foot}
    />
  );

  return wide ? (
    <View className="flex-1">
      <Stack.Screen options={{ title: tag.name, headerShown: false }} />
      <PanelLayout narrow={layout.sidebar === 'iconRail'} beside={layout.capturing} panel={panel}>
        {list}
      </PanelLayout>
      <UndoBarEdge />
    </View>
  ) : (
    <>
      <Stack.Screen
        options={{
          title: tag.name,
          headerShown: true,
          header: ({ navigation, back }: NativeStackHeaderProps) => (
            <ScreenHeader
              title={t('collection.tagPageTitle')}
              onBack={back ? navigation.goBack : undefined}
              backLabel={t('screenHeader.back')}
              right={
                <HeaderTextAction
                  label={t('collection.saveAsCollection')}
                  accessibilityLabel={t('collection.saveAsCollectionLabel')}
                  onPress={makeCollection}
                  disabled={save.isPending}
                />
              }
            />
          ),
        }}
      />
      {list}
    </>
  );
}
