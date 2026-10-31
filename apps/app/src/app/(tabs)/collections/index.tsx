import { Sheet, SheetChoices } from '@homelibra/ui/sheet';
import { TextTabs } from '@homelibra/ui/text-tabs';
import { router, useLocalSearchParams } from 'expo-router';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CollectionList, useCollections } from '@/components/collection-list';
import { TagList, useTags } from '@/components/tag-list';
import {
  type CollectionSort,
  loadCollectionSort,
  loadTagSort,
  saveCollectionSort,
  saveTagSort,
  type TagSort,
} from '@/lib/dizin-sort';
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type DizinView = 'collections' | 'tags';

/**
 * Dizin: Dosyalar | Etiketler as text tabs, each with its count, and Sırala
 * at the row's end. Etiketler lives here, not in its own tab, because a Tag's
 * page is already a temporary Collection. The view is a search param, so a
 * link can open Etiketler directly; each view's order is kept on the device.
 */
export default function DizinScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ view?: string }>();
  const view: DizinView = params.view === 'tags' ? 'tags' : 'collections';
  const [collectionSort, setCollectionSort] = useState<CollectionSort>(loadCollectionSort);
  const [tagSort, setTagSort] = useState<TagSort>(loadTagSort);
  const [sorting, setSorting] = useState(false);
  const collections = useCollections(collectionSort);
  const tags = useTags(tagSort);

  // A count shows once loaded and above nought.
  const count = (rows: readonly unknown[] | undefined) => (rows?.length ? rows.length : undefined);
  const tagSorts: { value: TagSort; label: string }[] = [
    { value: 'usage', label: t('collections.byUsage') },
    { value: 'name', label: t('collections.byName') },
  ];
  const collectionSorts: { value: CollectionSort; label: string }[] = [
    { value: 'recent', label: t('collections.byRecent') },
    { value: 'name', label: t('collections.byName') },
    { value: 'notes', label: t('collections.byNotes') },
  ];
  const sortLabel =
    view === 'tags'
      ? tagSorts.find((option) => option.value === tagSort)?.label
      : collectionSorts.find((option) => option.value === collectionSort)?.label;
  const shown = view === 'tags' ? tags : collections;
  const sortable = !shown.isError && (shown.data?.length ?? 0) > 0;

  // A press is the whole answer: the order applies, is kept, and the sheet closes.
  const chooseTagSort = (next: TagSort) => {
    setSorting(false);
    setTagSort(next);
    saveTagSort(next);
  };
  const chooseCollectionSort = (next: CollectionSort) => {
    setSorting(false);
    setCollectionSort(next);
    saveCollectionSort(next);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bar}>
        <TextTabs
          label={t('collections.viewLabel')}
          options={[
            { value: 'collections', label: t('collections.collections'), count: count(collections.data) },
            { value: 'tags', label: t('collections.tags'), count: count(tags.data) },
          ]}
          value={view}
          onChange={(next) => router.setParams({ view: next === 'tags' ? 'tags' : undefined })}
          right={
            sortable && (
              <SortButton
                label={t('collections.sortCurrent', { sort: (sortLabel ?? '').toLocaleLowerCase('tr') })}
                onPress={() => setSorting(true)}
              />
            )
          }
        />
      </View>
      {view === 'tags' ? <TagList sort={tagSort} /> : <CollectionList sort={collectionSort} />}
      <Sheet
        visible={sorting}
        title={t('collections.sort')}
        closeLabel={t('collections.close')}
        onClose={() => setSorting(false)}
      >
        {view === 'tags' ? (
          <SheetChoices label={t('collections.sortTags')} options={tagSorts} value={tagSort} onChange={chooseTagSort} />
        ) : (
          <SheetChoices
            label={t('collections.sortCollections')}
            options={collectionSorts}
            value={collectionSort}
            onChange={chooseCollectionSort}
          />
        )}
      </Sheet>
    </View>
  );
}

/** The filter icon and "Sırala" in accent; screen readers also hear the order in use. */
function SortButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      role="button"
      aria-label={label}
      onPress={onPress}
      style={({ pressed }) => [styles.sort, pressed && styles.pressed]}
    >
      <SlidersHorizontal color={colors.accent} size={20} strokeWidth={1.6} />
      <Text style={styles.sortText}>{t('collections.sort')}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    // Lines up with the root title.
    bar: { paddingHorizontal: space.gutter, paddingTop: 2 },
    sort: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingLeft: space.sm, paddingRight: 2 },
    sortText: { ...typeScale.action, color: c.accent },
    pressed: { opacity: 0.7 },
  });
