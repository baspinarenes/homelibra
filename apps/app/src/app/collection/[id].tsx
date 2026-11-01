import type { AppRouter } from '@homelibra/api';
import { HeaderTextAction, ScreenHeader } from '@homelibra/ui/screen-header';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { type NativeStackHeaderProps, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

import { CopyMarkdownAction, DeleteCollectionAction } from '@/components/collection-actions';
import { CollectionView, SourceNotesSwitch, ViewCount, ViewName } from '@/components/collection-view';
import { DefinitionTags } from '@/components/definition-tags';
import { narrowView, SearchField, useCollectionSearch, useSearchText } from '@/components/note-search';
import { SharedUndoBar } from '@/components/undo-bar';
import { useTRPC } from '@/lib/trpc';

type Collection = inferRouterOutputs<AppRouter>['collections']['view'];

/**
 * A Collection (#51): DOSYA in the header, beside it the Markdown copy of
 * the Notes shown (only the matches while searching) and Dosyayı sil (#52).
 * Under the header its name in full, its Tags as chips, the source-notes
 * switch and the count in a fixed bar, its Notes by Source under that.
 * Every change in the bar is kept in the definition, apart from the search
 * box, which only narrows what is shown. Tapping the name turns the header
 * into its renaming.
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
        <Text style={styles.lead}>{t('collection.loadFailed')}</Text>
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
  const search = useSearchText();
  const searched = useCollectionSearch(collection.id, search.query);
  const shown = narrowView(collection, searched.matches);

  // While saving, the bar shows what was chosen.
  const tagNames = setTags.isPending ? setTags.variables.names : collection.tags.map((tag) => tag.name);
  const includeSourceNotes = setSwitch.isPending
    ? setSwitch.variables.includeSourceNotes
    : collection.includeSourceNotes;

  const header = ({ navigation, back }: NativeStackHeaderProps) =>
    renaming ? (
      <RenameHeader
        initial={collection.name}
        busy={rename.isPending}
        onSave={(name) => rename.mutate({ id: collection.id, name })}
        onCancel={() => setRenaming(false)}
      />
    ) : (
      <ScreenHeader
        title={t('collection.pageTitle')}
        onBack={back ? navigation.goBack : undefined}
        backLabel={t('screenHeader.back')}
        right={
          <>
            <CopyMarkdownAction view={shown} />
            <DeleteCollectionAction collection={collection} />
          </>
        }
      />
    );

  const bar = (
    <>
      <ViewName name={collection.name} onPress={() => setRenaming(true)} hint={t('collection.rename')} />
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
    <View style={styles.page}>
      <Stack.Screen options={{ title: collection.name, header }} />
      {/* While the name is being written, the rest stands back and waits. */}
      <View style={[styles.page, renaming && styles.renaming]} pointerEvents={renaming ? 'none' : 'auto'}>
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
      </View>
      <View pointerEvents="box-none" style={styles.foot}>
        <SharedUndoBar />
      </View>
    </View>
  );
}

/** The header while the name is being written: Vazgeç (an X), the name, Kaydet; Kaydet stays off while it is blank. */
function RenameHeader({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: string;
  busy: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState(initial);
  const ready = name.trim().length > 0 && !busy;
  const save = () => ready && onSave(name.trim());
  return (
    <ScreenHeader
      backIcon="close"
      onBack={onCancel}
      backLabel={t('collection.cancel')}
      title={
        <TextInput
          aria-label={t('collection.nameLabel')}
          autoFocus
          value={name}
          onChangeText={setName}
          onSubmitEditing={save}
          returnKeyType="done"
          maxLength={200}
          style={styles.nameInput}
        />
      }
      right={<HeaderTextAction label={t('collection.save')} onPress={save} disabled={!ready} />}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    page: { flex: 1 },
    renaming: { opacity: 0.45 },
    // A text field's look, focused, a little lower to sit in the header.
    nameInput: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: radius.control,
      outlineColor: c.accentSoft,
      outlineWidth: 3,
      outlineStyle: 'solid',
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    // "Kopyalandı · n not" and failures float above this zero-height edge.
    foot: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    error: { ...typeScale.caption, color: c.danger },
  });
