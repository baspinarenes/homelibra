import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Sheet, SheetChoices } from '@homelibra/ui/sheet';
import { TextTabs } from '@homelibra/ui/text-tabs';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { CollectionList, useCollections } from '@/components/collection-list';
import { TagList, useTags } from '@/components/tag-list';
import { type CollectionSort, type TagSort, useCollectionSort, useTagSort } from '@/lib/dizin-sort';

type DizinView = 'collections' | 'tags';

/**
 * Dizin: Dosyalar | Etiketler as text tabs, each with its count; the header
 * has Sırala and, on Dosyalar, + for a Yeni dosya (#140). Etiketler lives
 * here, not in its own tab, because a Tag's page is already a temporary
 * Collection. The view is a search param, so a link can open Etiketler
 * directly; each view's order is kept on the device.
 */
export default function DizinScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ view?: string }>();
  const view: DizinView = params.view === 'tags' ? 'tags' : 'collections';
  const [collectionSort, keepCollectionSort] = useCollectionSort();
  const [tagSort, keepTagSort] = useTagSort();
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
  const closingWith =
    <T,>(keep: (next: T) => void) =>
    (next: T) => {
      setSorting(false);
      keep(next);
    };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderActions
              sort={
                sortable
                  ? {
                      label: t('collections.sortCurrent', { sort: (sortLabel ?? '').toLocaleLowerCase('tr') }),
                      onPress: () => setSorting(true),
                    }
                  : undefined
              }
              onNew={view === 'collections' ? () => router.push('/collection/new') : undefined}
            />
          ),
        }}
      />
      <View style={styles.bar}>
        <TextTabs
          label={t('collections.viewLabel')}
          options={[
            { value: 'collections', label: t('collections.collections'), count: count(collections.data) },
            { value: 'tags', label: t('collections.tags'), count: count(tags.data) },
          ]}
          value={view}
          onChange={(next) => router.setParams({ view: next === 'tags' ? 'tags' : undefined })}
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
          <SheetChoices
            label={t('collections.sortTags')}
            options={tagSorts}
            value={tagSort}
            onChange={closingWith(keepTagSort)}
          />
        ) : (
          <SheetChoices
            label={t('collections.sortCollections')}
            options={collectionSorts}
            value={collectionSort}
            onChange={closingWith(keepCollectionSort)}
          />
        )}
      </Sheet>
    </View>
  );
}

/**
 * The header's icons: Sırala, once the view has rows to order (screen readers
 * also hear the order in use); then + for a Yeni dosya, but not on Etiketler,
 * since a Tag is never made on its own, only added to a Note or a Source.
 */
function HeaderActions({ sort, onNew }: { sort?: { label: string; onPress: () => void }; onNew?: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.headerActions}>
      {sort && <HeaderIconAction icon={SlidersHorizontal} label={sort.label} size={24} onPress={sort.onPress} />}
      {onNew && <HeaderIconAction icon={Plus} label={t('collections.new')} size={24} onPress={onNew} />}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    // Lines up with the root title.
    bar: { paddingHorizontal: space.gutter, paddingTop: 2 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
  });
