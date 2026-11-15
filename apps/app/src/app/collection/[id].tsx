import type { AppRouter } from '@homelibra/api';
import { Button } from '@homelibra/ui/button';
import { type MenuItem, MoreMenu } from '@homelibra/ui/menu';
import { PanelLayout } from '@homelibra/ui/panel';
import { HeaderIconAction, ScreenHeader } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { cx, type as typeScale, useTheme } from '@homelibra/ui/theme';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { type NativeStackHeaderProps, Stack, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import Copy from 'lucide-react-native/icons/copy';
import Search from 'lucide-react-native/icons/search';
import { type ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, type TextInputInstance, View } from 'react-native';

import {
  CopyMarkdownAction,
  DeleteCollectionAction,
  useCopyMarkdown,
  useDeleteCollection,
} from '@/features/collection/collection-actions';
import { CollectionView, SourceNotesSwitch, ViewCount, ViewName } from '@/features/collection/collection-view';
import { DefinitionTags } from '@/features/collection/definition-tags';
import { UndoBarEdge, useViewPanel, WideSearchNotes } from '@/features/collection/view-panel';
import { narrowView, SearchField, ShortWords, useCollectionSearch, useSearchText } from '@/features/search/note-search';
import { useTRPC } from '@/lib/trpc';

type Collection = inferRouterOutputs<AppRouter>['collections']['view'];

/**
 * A Collection (#51): DOSYA in the header, beside it the search's magnifier,
 * the Markdown copy of the Notes shown (only the matches while searching)
 * and Dosyayı sil (#52). Under the header its name in full, its Tags as
 * chips and the count with the source-notes switch at its right in a fixed
 * bar, its Notes by Source under that. Every change in the bar is kept in the definition.
 * Tapping the name opens its renaming in its place. The magnifier makes the
 * header the search's field, as on a Source's page, while the bar folds to
 * the name on one line and the count; the search only narrows what is shown,
 * and going back puts it away before it leaves the page.
 *
 * On a wide screen (#171) there is no header: the list's own head has the
 * magnifier and ⋯ (Markdown olarak kopyala ⌘⇧C, Dosyayı sil), the Notes
 * stand in full rows in a centred reading column, and a Note opens in the
 * panel beside them, the rows going compact. ↑↓ move the panel through the
 * rows, ⌘C copies its Note, E edits it, / searches, Esc closes the panel.
 * The search (#172) makes the list's head its box, with Bulunanları kopyala
 * beside it and under them the name and "3 / 15 not · 3 kaynak"; / puts the
 * cursor back in the box, Esc puts it away once the panel is closed.
 */
export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const trpc = useTRPC();
  const view = useQuery(trpc.collections.view.queryOptions({ id }));

  return view.data ? (
    <CollectionPage collection={view.data} />
  ) : (
    <View className="flex-1 items-center justify-center bg-page p-xl">
      <Stack.Screen options={{ title: '' }} />
      {view.isError ? (
        <Text variant="body" className="text-center">
          {t('collection.loadFailed')}
        </Text>
      ) : (
        <ActivityIndicator color={colors.accent} />
      )}
    </View>
  );
}

function CollectionPage({ collection }: { collection: Collection }) {
  const { t } = useTranslation();
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
  const [searching, setSearching] = useState(false);
  const search = useSearchText();
  const searched = useCollectionSearch(collection.id, searching ? search.query : '');
  const shown = narrowView(collection, searched.matches);
  const searchField = useRef<TextInputInstance>(null);
  const closeSearch = () => {
    setSearching(false);
    search.setText('');
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const copyAll = useCopyMarkdown(shown);
  const deletion = useDeleteCollection(collection);
  const { layout, wide, panelOpen, wideList, panel, foot } = useViewPanel({
    view: collection,
    shown,
    found: searched.matches !== null,
    searching,
    renaming,
    menuOpen,
    copyAll: copyAll.copy,
    // Open already: the cursor goes back to the box (a new box takes it as it opens).
    onSearchHere: () => (searching ? searchField.current?.focus() : setSearching(true)),
    onCloseSearch: closeSearch,
    onCancelRename: () => setRenaming(false),
  });
  // The phone's back puts the search away before it leaves the page. On a wide screen Esc does,
  // and the sidebar, like any way out, leaves at the first press.
  usePreventRemove(searching && !wide, closeSearch);

  // While saving, the bar shows what was chosen.
  const tagNames = setTags.isPending ? setTags.variables.names : collection.tags.map((tag) => tag.name);
  const includeSourceNotes = setSwitch.isPending
    ? setSwitch.variables.includeSourceNotes
    : collection.includeSourceNotes;

  // The actions wait while the name is being written; while searching, the copy of what is found stays.
  const header = ({ navigation, back }: NativeStackHeaderProps) => (
    <ScreenHeader
      title={
        searching ? (
          <SearchField
            look="bar"
            value={search.text}
            onChange={search.setText}
            placeholder={t('noteSearch.inView')}
            autoFocus
            // With no arrow to go back by (a page opened fresh on the web), the × puts it away.
            onClose={back ? undefined : closeSearch}
          />
        ) : (
          t('collection.pageTitle')
        )
      }
      onBack={back ? navigation.goBack : undefined}
      backLabel={t('screenHeader.back')}
      right={
        !renaming && (
          <>
            {!searching && (
              <HeaderIconAction icon={Search} label={t('noteSearch.inView')} onPress={() => setSearching(true)} />
            )}
            <CopyMarkdownAction view={shown} />
            {!searching && <DeleteCollectionAction collection={collection} />}
          </>
        )
      }
    />
  );

  const name = !renaming && (
    <ViewName name={collection.name} onPress={() => setRenaming(true)} hint={t('collection.rename')} />
  );
  const definition = (
    <DefinitionTags names={tagNames} onChange={(names) => setTags.mutate({ id: collection.id, names })} />
  );
  const searchedName = (
    <Text variant="sourceTitleSm" numberOfLines={1}>
      {collection.name}
    </Text>
  );

  const counts = (
    <>
      {/* With no match, the words stand under "Eşleşen not yok." instead. */}
      {shown.noteCount > 0 && <ShortWords words={searched.shortWords} />}
      <ViewCount
        view={shown}
        of={collection}
        aside={
          !searching && (
            <SourceNotesSwitch
              value={includeSourceNotes}
              count={collection.sourceOnlyCount}
              onChange={(value) => setSwitch.mutate({ id: collection.id, includeSourceNotes: value })}
            />
          )
        }
      />
      {searched.failed && (
        <Text variant="caption" color="danger">
          {t('noteSearch.failed')}
        </Text>
      )}
      {failed && (
        <Text variant="caption" color="danger">
          {t('collection.saveFailed')}
        </Text>
      )}
    </>
  );

  // Under the wide search's name and count, which stand on one line.
  const wideSearchNotes = (
    <WideSearchNotes
      shortWords={searched.shortWords}
      noteCount={shown.noteCount}
      searchFailed={searched.failed}
      saveFailed={failed}
    />
  );

  const bar = (
    <>
      {searching ? (
        searchedName
      ) : (
        <>
          {name}
          {definition}
        </>
      )}
      {counts}
    </>
  );

  // The wide head: the magnifier and ⋯ beside DOSYA, or beside the name while the panel narrows the list.
  const menuItems: MenuItem[] = [
    { label: t('collectionActions.copy'), keys: '⌘⇧C', onPress: copyAll.copy, disabled: copyAll.count === 0 },
    ...(searching
      ? []
      : [
          {
            label: t('collectionActions.delete'),
            tone: 'danger' as const,
            onPress: deletion.remove,
            disabled: deletion.busy,
          },
        ]),
  ];
  const actions = !renaming && (
    <View className="flex-row items-center gap-xs">
      {!searching && (
        <HeaderIconAction icon={Search} label={t('noteSearch.inView')} onPress={() => setSearching(true)} />
      )}
      <MoreMenu label={t('widePanel.more')} items={menuItems} open={menuOpen} onOpenChange={setMenuOpen} />
    </View>
  );
  // Only what the search found, never the whole file while the box is empty or the first answer is on its way.
  const found = searched.matches !== null && shown.noteCount > 0;
  const wideBar = (
    <>
      {searching ? (
        <>
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
            {!renaming && (
              <Button
                label={t('noteSearch.copyFound')}
                variant="small"
                icon={Copy}
                onPress={copyAll.copy}
                disabled={!found}
              />
            )}
          </View>
          <View className="flex-row items-baseline justify-between gap-md">
            <View className="min-w-0 flex-1">{searchedName}</View>
            <ViewCount view={shown} of={collection} />
          </View>
        </>
      ) : panelOpen ? (
        <View className="flex-row items-center gap-sm">
          <View className="min-w-0 flex-1">{name}</View>
          {actions}
        </View>
      ) : (
        <>
          <View className="flex-row items-center justify-between gap-sm">
            <Text variant="micro">{t('collection.pageTitle')}</Text>
            {actions}
          </View>
          {name}
        </>
      )}
      {!searching && definition}
      {searching ? wideSearchNotes : counts}
    </>
  );

  return wide ? (
    <View className="flex-1">
      <Stack.Screen options={{ title: collection.name, headerShown: false }} />
      <PanelLayout narrow={layout.sidebar === 'iconRail'} beside={layout.capturing} panel={panel}>
        {page(wideBar)}
      </PanelLayout>
      <UndoBarEdge />
    </View>
  ) : (
    <View className="flex-1">
      <Stack.Screen options={{ title: collection.name, header, headerShown: true }} />
      {page(bar)}
      <UndoBarEdge />
    </View>
  );

  /** The renaming over the page, and the page: the bar and the Notes. */
  function page(head: ReactNode) {
    return (
      <>
        {renaming && (
          <RenameField
            initial={collection.name}
            busy={rename.isPending}
            failed={rename.isError}
            onSave={(name) => rename.mutate({ id: collection.id, name })}
            onCancel={() => setRenaming(false)}
          />
        )}
        {/* While the name is being written, the rest stands back and waits. */}
        <View className={cx('flex-1', renaming && 'opacity-45')} pointerEvents={renaming ? 'none' : 'auto'}>
          <CollectionView
            view={shown}
            bar={head}
            matches={searched.matches}
            underEmpty={searched.matches && <ShortWords words={searched.shortWords} centered />}
            empty={
              searched.matches
                ? t('noteSearch.viewEmpty')
                : collection.tags.length === 0
                  ? t('collection.emptyNoTags')
                  : t('collection.emptyNoNotes')
            }
            wide={wideList}
            foot={foot}
          />
        </View>
      </>
    );
  }
}

/**
 * The name being written in its own place, over the page standing back: in
 * the face it is shown in, on as many lines as it takes, Vazgeç and Kaydet
 * under it; Kaydet stays off while it is blank.
 */
function RenameField({
  initial,
  busy,
  failed,
  onSave,
  onCancel,
}: {
  initial: string;
  busy: boolean;
  failed: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial);
  const ready = name.trim().length > 0 && !busy;
  const save = () => ready && onSave(name.trim());
  return (
    <View className="gap-sm px-lg pt-sm">
      <TextField
        label={t('collection.nameLabel')}
        labelHidden
        autoFocus
        multiline
        submitBehavior="submit"
        value={name}
        onChangeText={setName}
        onSubmitEditing={save}
        returnKeyType="done"
        maxLength={200}
        error={failed ? t('collection.saveFailed') : undefined}
        style={nameInput}
      />
      <View className="flex-row items-center justify-end gap-md">
        <Button label={t('collection.cancel')} variant="text" onPress={onCancel} />
        <Button label={t('collection.save')} variant="small" onPress={save} disabled={!ready} busy={busy} />
      </View>
    </View>
  );
}

// TextField sets its own face and height; a style handed to it is laid over them.
const nameInput = { ...typeScale.sourceTitle, minHeight: 50 };
