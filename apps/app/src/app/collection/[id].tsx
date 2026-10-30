import type { AppRouter } from '@homelibra/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CollectionMenu, CopyMarkdownButton } from '@/components/collection-actions';
import { CollectionView, SourceNotesSwitch, ViewCount } from '@/components/collection-view';
import { DefinitionTags } from '@/components/definition-tags';
import { NameInput } from '@/components/name-input';
import { SharedUndoBar } from '@/components/undo-bar';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type Collection = inferRouterOutputs<AppRouter>['collections']['view'];

/**
 * A Collection (#51): its name, its Tags as chips, the source-notes switch
 * and the count in a fixed bar, its Notes by Source under it. Every change
 * in the bar is kept in the definition. Beside the name, the Markdown copy;
 * in the header, the ⋯ menu with Dosyayı sil (#52). The search box arrives in #56.
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
        <View style={styles.nameRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityHint={t('collection.rename')}
            onPress={() => setRenaming(true)}
            style={({ pressed }) => [styles.nameButton, pressed && styles.pressed]}
          >
            <Text style={styles.name}>{collection.name}</Text>
          </Pressable>
          <CopyMarkdownButton view={collection} />
        </View>
      )}
      <DefinitionTags names={tagNames} onChange={(names) => setTags.mutate({ id: collection.id, names })} />
      <SourceNotesSwitch
        value={includeSourceNotes}
        count={collection.sourceOnlyCount}
        onChange={(value) => setSwitch.mutate({ id: collection.id, includeSourceNotes: value })}
      />
      <ViewCount view={collection} />
      {failed && <Text style={styles.error}>{t('collection.saveFailed')}</Text>}
    </>
  );

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ headerRight: () => <CollectionMenu collection={collection} /> }} />
      <CollectionView
        view={collection}
        bar={bar}
        empty={collection.tags.length === 0 ? t('collection.emptyNoTags') : t('collection.emptyNoNotes')}
      />
      <View pointerEvents="box-none" style={styles.foot}>
        <SharedUndoBar />
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    name: { ...typeScale.title, color: c.fg },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    nameButton: { flex: 1, minWidth: 0 },
    page: { flex: 1 },
    // "Kopyalandı · n not" and failures float above this zero-height edge.
    foot: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    error: { ...typeScale.caption, color: c.danger },
  });
