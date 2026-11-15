import type { AppRouter } from '@homelibra/api';
import { Button } from '@homelibra/ui/button';
import { type MenuItem, MoreMenu } from '@homelibra/ui/menu';
import { KeyHints, PanelLayout } from '@homelibra/ui/panel';
import { HeaderIconAction, HeaderTextAction, ScreenHeader } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { type NativeStackHeaderProps, Stack, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import Search from 'lucide-react-native/icons/search';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { copyNoteMarkdown, useCopyMarkdown } from '@/features/collection/collection-actions';
import { focusedNote, ViewNotePanel } from '@/features/collection/collection-note-panel';
import { CollectionView, SourceNotesSwitch, ViewCount, ViewName } from '@/features/collection/collection-view';
import { type NoteFocus, stepInView } from '@/features/collection/note-focus';
import { viewAction } from '@/features/collection/view-keys';
import { narrowView, SearchField, ShortWords, useSearchText, useTagSearch } from '@/features/search/note-search';
import { useFramePanel } from '@/components/wide-frame';
import { SharedUndoBar } from '@/components/undo-bar';
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
 * magnifier or /, and the keys are the Collection's: Esc closes the panel,
 * then the search, and never leaves the page.
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

  // The wide tier's panel: which Note it shows, null while it is closed (as it is on entry).
  const [focus, setFocus] = useState<NoteFocus | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const layout = useFramePanel(focus !== null);
  const wide = layout.tier === 'wide';
  const panelOpen = wide && focus !== null;
  const inFront = useIsFocused();

  // On the phone the box is always there; on a wide screen it waits behind the magnifier or /.
  const [searching, setSearching] = useState(false);
  const search = useSearchText();
  const searched = useTagSearch(tag.id, includeSourceNotes, wide && !searching ? '' : search.query);
  const shown = narrowView(view, searched.matches);
  const closeSearch = () => {
    setSearching(false);
    search.setText('');
  };
  usePreventRemove(wide && searching, closeSearch);

  const copyAll = useCopyMarkdown({ ...shown, name: tag.name });
  // The focused Source's Notes as the panel fetched them: a key acts on them at once, the clipboard allows no wait.
  const sourceNotes = (sourceId: string) => queryClient.getQueryData(trpc.notes.list.queryKey({ sourceId }));

  useShortcuts({ panelOpen, active: wide && inFront && !menuOpen }, (command) => {
    const action = viewAction(command, { panelOpen, renaming: false, searching, notes: shown.noteCount });
    switch (action) {
      case 'previous':
      case 'next': {
        const order = focus ? sourceNotes(focus.sourceId)?.map((note) => note.id) : undefined;
        const to = stepInView(shown, focus, action, order);
        if (to) setFocus(to);
        return to !== null;
      }
      case 'copyNote': {
        if (!focus) return false;
        const { source, note } = focusedNote(view, focus, sourceNotes(focus.sourceId));
        if (!source || !note) return false;
        copyNoteMarkdown(source, note, {
          done: t('collectionActions.copied', { count: 1 }),
          failed: t('collectionActions.copyFailed'),
        });
        return true;
      }
      case 'copyAll':
        copyAll.copy();
        return true;
      case 'edit':
        if (!focus) return false;
        router.push({ pathname: '/note/[id]', params: { id: focus.noteId } });
        return true;
      case 'searchHere':
        setSearching(true);
        return true;
      case 'closePanel':
        setFocus(null);
        return true;
      case 'closeSearch':
        closeSearch();
        return true;
      default:
        return false;
    }
  });

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

  // Along the list's foot while the panel is open, beside the full sidebar; only keys that act here.
  const keyHints = [
    { keys: '↑↓', label: t('widePanel.hintRows') },
    { keys: '⌘C', label: t('widePanel.hintCopyNote') },
    { keys: '⌘⇧C', label: t('widePanel.hintCopyAll') },
    ...(searching ? [] : [{ keys: '/', label: t('widePanel.hintSearch') }]),
    { keys: 'Esc', label: t('widePanel.hintClose') },
  ];

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
  const crumb = (
    <Pressable
      role="link"
      aria-label={t('collection.tagCrumbLabel')}
      onPress={() => router.dismissTo({ pathname: '/collections', params: { view: 'tags' } })}
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
          <SearchField
            value={search.text}
            onChange={search.setText}
            placeholder={t('noteSearch.inView')}
            autoFocus
            onClose={closeSearch}
          />
          <Text variant="sourceTitleSm" numberOfLines={1}>
            {tag.name}
          </Text>
        </>
      ) : (
        <>
          {!panelOpen && (
            <Text variant="micro" color="accent">
              {t('collection.tagPageTitle')}
            </Text>
          )}
          <ViewName name={tag.name} />
        </>
      )}
      {counts}
    </>
  );

  const list = (
    <CollectionView
      view={shown}
      bar={wide ? wideBar : bar}
      matches={searched.matches}
      underEmpty={searched.matches && <ShortWords words={searched.shortWords} centered />}
      empty={searched.matches ? t('noteSearch.viewEmpty') : t('collection.emptyTagNoNotes')}
      wide={wide ? { density: layout.density, focus, onOpen: setFocus } : undefined}
      foot={panelOpen && layout.sidebar === 'full' && <KeyHints hints={keyHints} />}
    />
  );

  return wide ? (
    <View className="flex-1">
      <Stack.Screen options={{ title: tag.name, headerShown: false }} />
      <PanelLayout
        narrow={layout.sidebar === 'iconRail'}
        panel={focus && <ViewNotePanel view={view} focus={focus} onFocus={setFocus} onClose={() => setFocus(null)} />}
      >
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

function UndoBarEdge() {
  return (
    // "Kopyalandı · n not" and failures float above this zero-height edge.
    <View pointerEvents="box-none" className="absolute right-0 bottom-0 left-0">
      <SharedUndoBar />
    </View>
  );
}
