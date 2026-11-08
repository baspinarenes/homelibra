import type { AppRouter } from '@homelibra/api';
import { Button } from '@homelibra/ui/button';
import { HeaderIconAction, ScreenHeader } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { type NativeStackHeaderProps, Stack, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import Search from 'lucide-react-native/icons/search';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CopyMarkdownAction, DeleteCollectionAction } from '@/components/collection-actions';
import { CollectionView, SourceNotesSwitch, ViewCount, ViewName } from '@/components/collection-view';
import { DefinitionTags } from '@/components/definition-tags';
import { narrowView, SearchField, ShortWords, useCollectionSearch, useSearchText } from '@/components/note-search';
import { SharedUndoBar } from '@/components/undo-bar';
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
 */
export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const view = useQuery(trpc.collections.view.queryOptions({ id }));

  return view.data ? (
    <CollectionPage collection={view.data} />
  ) : (
    <View style={styles.center}>
      <Stack.Screen options={{ title: '' }} />
      {view.isError ? (
        <Text variant="body" style={styles.lead}>
          {t('collection.loadFailed')}
        </Text>
      ) : (
        <ActivityIndicator color={styles.spinner.color} />
      )}
    </View>
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
  const [searching, setSearching] = useState(false);
  const search = useSearchText();
  const searched = useCollectionSearch(collection.id, searching ? search.query : '');
  const shown = narrowView(collection, searched.matches);
  const closeSearch = () => {
    setSearching(false);
    search.setText('');
  };
  usePreventRemove(searching, closeSearch);

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

  const bar = (
    <>
      {searching ? (
        <Text variant="sourceTitleSm" numberOfLines={1}>
          {collection.name}
        </Text>
      ) : (
        <>
          {!renaming && (
            <ViewName name={collection.name} onPress={() => setRenaming(true)} hint={t('collection.rename')} />
          )}
          <DefinitionTags names={tagNames} onChange={(names) => setTags.mutate({ id: collection.id, names })} />
        </>
      )}
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

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: collection.name, header }} />
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
      <View style={[styles.page, renaming && styles.renaming]} pointerEvents={renaming ? 'none' : 'auto'}>
        <CollectionView
          view={shown}
          bar={bar}
          matches={searched.matches}
          underEmpty={searched.matches && <ShortWords words={searched.shortWords} centered />}
          empty={
            searched.matches
              ? t('noteSearch.viewEmpty')
              : collection.tags.length === 0
                ? t('collection.emptyNoTags')
                : t('collection.emptyNoNotes')
          }
        />
      </View>
      <View pointerEvents="box-none" style={styles.foot}>
        <SharedUndoBar />
      </View>
    </View>
  );
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
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState(initial);
  const ready = name.trim().length > 0 && !busy;
  const save = () => ready && onSave(name.trim());
  return (
    <View style={styles.rename}>
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
        style={styles.nameInput}
      />
      <View style={styles.renameActions}>
        <Button label={t('collection.cancel')} variant="text" onPress={onCancel} />
        <Button label={t('collection.save')} variant="small" onPress={save} disabled={!ready} busy={busy} />
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { textAlign: 'center' },
    spinner: { color: c.accent },
    page: { flex: 1 },
    renaming: { opacity: 0.45 },
    rename: { gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm },
    nameInput: { ...typeScale.sourceTitle, minHeight: 50 },
    renameActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.md },
    // "Kopyalandı · n not" and failures float above this zero-height edge.
    foot: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  });
