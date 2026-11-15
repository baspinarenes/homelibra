import { Button } from '@homelibra/ui/button';
import { CollectionRow, DizinColumn, TagRow } from '@homelibra/ui/dizin';
import { MoreMenu } from '@homelibra/ui/menu';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useShortcuts } from '@homelibra/ui/wide-layout';
import { useIsFocused, useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import { type ComponentRef, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, type Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListMessage } from '@/components/list-message';
import { useFramePanel } from '@/components/wide-frame';
import { useCollections } from '@/features/collection/collection-list';
import { type DizinRow, inDizin, stepInDizin } from '@/features/collection/dizin-selection';
import type { CollectionSort, TagSort } from '@/features/collection/dizin-sort';
import { NewCollectionPanel } from '@/features/collection/new-collection';
import { elapsed } from '@/features/library/elapsed';
import { TagActions, type TagActionStart, type TagRef } from '@/features/tag/tag-actions';
import { useTags } from '@/features/tag/tag-list';

type RowRef = ComponentRef<typeof Pressable>;
type Sorting<T> = { value: T; options: readonly { value: T; label: string }[]; onChange: (next: T) => void };
type Menu = 'collectionSort' | 'tagSort' | { tag: string };

/**
 * Dizin on a wide screen (#181): no tabs, Dosyalar and Etiketler side by
 * side, each in the order chosen at its head and kept on the device (#140).
 * A Collection's row shows its counts, Tags and last change; a Tag's row
 * its counts, and its ⋯ (Yeniden adlandır, Birleştir…, Sil) only under the
 * pointer or the focus. A press, or ↵ on the row ↑↓ chose, opens the
 * Collection or the Tag's page. "+ Yeni dosya" at the head of Dosyalar
 * opens the form in the panel beside them.
 */
export function WideDizin({
  collectionSort,
  tagSort,
}: {
  collectionSort: Sorting<CollectionSort>;
  tagSort: Sorting<TagSort>;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const inFront = useIsFocused();
  const collections = useCollections(collectionSort.value);
  const tags = useTags(tagSort.value);
  // Yeni dosya's panel: closed on entry, as every panel is.
  const [creating, setCreating] = useState(false);
  useFramePanel(creating);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [acting, setActing] = useState<{ tag: TagRef; start: TagActionStart } | null>(null);

  // The row ↑↓ chose, and the focus put on it, so ↵ opens it and the column scrolls to it.
  const columns = {
    collections: collections.data?.map((collection) => collection.id) ?? [],
    tags: tags.data?.map((tag) => tag.id) ?? [],
  };
  const [chosen, setChosen] = useState<DizinRow | null>(null);
  const selected = inDizin(columns, chosen);
  const rows = useRef(new Map<string, RowRef>());
  const rowKey = (row: DizinRow) => `${row.column}:${row.id}`;
  const rowRef = (row: DizinRow) => (ref: RowRef | null) => {
    if (ref) rows.current.set(rowKey(row), ref);
    else rows.current.delete(rowKey(row));
  };
  const isSelected = (row: DizinRow) => selected?.column === row.column && selected.id === row.id;

  const openRow = (row: DizinRow) =>
    row.column === 'collections'
      ? router.push({ pathname: '/collection/[id]', params: { id: row.id } })
      : router.push({ pathname: '/tag/[id]', params: { id: row.id } });

  useShortcuts({ panelOpen: creating, active: inFront && menu === null && acting === null }, (command) => {
    if (command === 'previous' || command === 'next') {
      const next = stepInDizin(columns, selected, command);
      setChosen(next);
      if (next) rows.current.get(rowKey(next))?.focus();
      return next !== null;
    }
    if (command === 'open' && selected) {
      openRow(selected);
      return true;
    }
    return false;
  });

  // A column's order, the one in force on its button; screen readers also hear which column it orders.
  const sortMenu = <T extends string>(
    which: 'collectionSort' | 'tagSort',
    sorting: Sorting<T>,
    label: (sort: string) => string,
  ) => {
    const current = sorting.options.find((option) => option.value === sorting.value)?.label ?? '';
    return (
      <MoreMenu
        label={label(current.toLocaleLowerCase('tr'))}
        trigger={current}
        open={menu === which}
        onOpenChange={(open) => setMenu(open ? which : null)}
        items={sorting.options.map((option) => ({
          label: option.label,
          checked: option.value === sorting.value,
          onPress: () => sorting.onChange(option.value),
        }))}
      />
    );
  };

  const loading = <ActivityIndicator className="mt-xl" color={colors.accent} />;
  const failed = (lead: string, retry: () => void) => (
    <ListMessage lead={lead} action={{ label: t('collections.retry'), variant: 'text', onPress: retry }} />
  );

  const collectionColumn = collections.isPending ? (
    loading
  ) : collections.isError ? (
    failed(t('collection.listFailed'), () => void collections.refetch())
  ) : (
    <FlatList
      className="flex-1"
      contentContainerClassName="grow pb-xxl"
      data={collections.data}
      keyExtractor={(collection) => collection.id}
      ListEmptyComponent={
        <ListMessage
          title={t('collections.emptyTitle')}
          lead={t('wideDizin.emptyLead')}
          action={{ label: t('collections.new'), onPress: () => setCreating(true) }}
        />
      }
      renderItem={({ item: collection }) => {
        const row = { column: 'collections', id: collection.id } as const;
        return (
          <CollectionRow
            ref={rowRef(row)}
            name={collection.name}
            counts={
              collection.noteCount > 0
                ? t('collection.counts', { notes: collection.noteCount, sources: collection.sourceCount })
                : t('collection.noteCount', { count: 0 })
            }
            tags={collection.tags.map((tag) => tag.name)}
            noTags={t('collection.noTags')}
            changed={elapsed(t, collection.updatedAt)}
            selected={isSelected(row)}
            onFocus={() => setChosen(row)}
            onPress={() => {
              setChosen(row);
              openRow(row);
            }}
          />
        );
      }}
    />
  );

  const tagColumn = tags.isPending ? (
    loading
  ) : tags.isError ? (
    failed(t('tags.loadFailed'), () => void tags.refetch())
  ) : (
    <FlatList
      className="flex-1"
      contentContainerClassName="grow pb-xxl"
      data={tags.data}
      keyExtractor={(tag) => tag.id}
      ListEmptyComponent={<ListMessage title={t('collections.tagsEmptyTitle')} lead={t('collections.tagsEmptyLead')} />}
      renderItem={({ item: tag }) => {
        const row = { column: 'tags', id: tag.id } as const;
        const act = (start: TagActionStart) => () => setActing({ tag: { id: tag.id, name: tag.name }, start });
        return (
          <TagRow
            ref={rowRef(row)}
            name={tag.name}
            counts={t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount })}
            menu={{
              label: t('tagActions.menuFor', { name: tag.name }),
              open: typeof menu === 'object' && menu?.tag === tag.id,
              onOpenChange: (open) => setMenu(open ? { tag: tag.id } : null),
              items: [
                { label: t('tagActions.rename'), onPress: act('rename') },
                { label: t('tagActions.merge'), onPress: act('pick') },
                { label: t('tagActions.delete'), tone: 'danger', onPress: act('delete') },
              ],
            }}
            selected={isSelected(row)}
            onFocus={() => setChosen(row)}
            onPress={() => {
              setChosen(row);
              openRow(row);
            }}
          />
        );
      }}
    />
  );

  return (
    <View className="flex-1 flex-row bg-page">
      <View className={creating ? 'min-w-0 flex-1 border-r border-line' : 'min-w-0 flex-1'}>
        {/* The header bar kept the status bar's inset; without it the title does, 20 under it. */}
        <View className="px-xxl" style={{ paddingTop: top + 20 }}>
          <Text variant="title">{t('tabs.collections')}</Text>
        </View>
        {/* Beside the panel two columns would leave each about 200 px: one over the other, each scrolling. */}
        <View
          className={creating ? 'min-h-0 flex-1 gap-lg px-xxl pt-md' : 'min-h-0 flex-1 flex-row gap-xxl px-xxl pt-md'}
        >
          <DizinColumn
            title={t('collections.collections')}
            count={collections.data?.length || undefined}
            actions={
              <>
                {!!collections.data?.length &&
                  sortMenu('collectionSort', collectionSort, (sort) => t('wideDizin.sortCollections', { sort }))}
                {!creating && (
                  <Button label={t('collections.new')} icon={Plus} variant="small" onPress={() => setCreating(true)} />
                )}
              </>
            }
          >
            {collectionColumn}
          </DizinColumn>
          <DizinColumn
            title={t('collections.tags')}
            count={tags.data?.length || undefined}
            actions={!!tags.data?.length && sortMenu('tagSort', tagSort, (sort) => t('wideDizin.sortTags', { sort }))}
          >
            {tagColumn}
          </DizinColumn>
        </View>
      </View>
      {creating && (
        <View className="w-[520px]">
          <NewCollectionPanel
            active={inFront && acting === null}
            onClose={() => setCreating(false)}
            onSaved={(id) => {
              setCreating(false);
              router.push({ pathname: '/collection/[id]', params: { id } });
            }}
          />
        </View>
      )}
      <TagActions
        key={acting?.tag.id}
        tag={acting?.tag ?? null}
        start={acting?.start}
        onClose={() => setActing(null)}
      />
    </View>
  );
}
