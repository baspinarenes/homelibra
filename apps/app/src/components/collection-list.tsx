import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { NameInput } from '@/components/name-input';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Dosyalar (#51, story 106): every Collection A–Z with its Tags and how many
 * Notes it shows now, and "+ Yeni dosya", which asks for a name and opens
 * the new, empty Collection to add Tags to.
 */
export function CollectionList() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const collections = useQuery(trpc.collections.list.queryOptions());
  const [naming, setNaming] = useState(false);
  const create = useMutation(
    trpc.collections.create.mutationOptions({
      onSuccess: async ({ id }) => {
        setNaming(false);
        await queryClient.invalidateQueries({ queryKey: trpc.collections.list.queryKey() });
        router.push({ pathname: '/collection/[id]', params: { id } });
      },
    }),
  );

  const header = (
    <View style={styles.new}>
      {naming ? (
        <NameInput
          confirmLabel={t('collection.create')}
          busy={create.isPending}
          onConfirm={(name) => create.mutate({ name, tags: [] })}
          onCancel={() => setNaming(false)}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setNaming(true)}
          hitSlop={6}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.newLabel}>{t('collection.newCollection')}</Text>
        </Pressable>
      )}
      {create.isError && <Text style={styles.error}>{t('collection.saveFailed')}</Text>}
    </View>
  );

  if (collections.isPending) return <ActivityIndicator style={styles.status} color={styles.spinner.color} />;
  if (collections.isError) return <Text style={[styles.lead, styles.status]}>{t('collection.listFailed')}</Text>;
  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={collections.data}
      keyExtractor={(collection) => collection.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={[styles.lead, styles.status]}>{t('collection.listEmpty')}</Text>}
      renderItem={({ item: collection, index }) => (
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/collection/[id]', params: { id: collection.id } })}
          style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
        >
          <View style={styles.texts}>
            <Text style={styles.name}>{collection.name}</Text>
            <Text style={collection.tags.length ? styles.tags : styles.untagged}>
              {collection.tags.length ? collection.tags.map((tag) => tag.name).join(' · ') : t('collection.noTags')}
            </Text>
          </View>
          <Text style={styles.count}>{t('collection.noteCount', { count: collection.noteCount })}</Text>
        </Pressable>
      )}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    status: { marginTop: space.xl },
    spinner: { color: c.accent },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center', paddingHorizontal: space.lg },
    pressed: { opacity: 0.7 },
    new: { gap: space.sm, paddingTop: space.md, paddingBottom: space.sm },
    newLabel: { ...typeScale.button, fontSize: 15, color: c.accent },
    error: { ...typeScale.caption, color: c.danger },
    row: { flexDirection: 'row', alignItems: 'baseline', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    texts: { flex: 1, gap: 3 },
    name: { ...typeScale.sourceTitleSm, color: c.fg },
    tags: { ...typeScale.caption, color: c.chipInk },
    untagged: { ...typeScale.caption, color: c.muted2 },
    count: { ...typeScale.locator, fontSize: 11.5, color: c.muted },
  });
