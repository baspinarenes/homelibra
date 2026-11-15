import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Table, type TableColumn, TableHead, TableRow } from '@homelibra/ui/table';
import { Text } from '@homelibra/ui/text';
import type { Density } from '@homelibra/ui/wide-layout';
import type { inferRouterOutputs } from '@trpc/server';
import { type ComponentRef, type ReactElement, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, type Pressable, View } from 'react-native';

import { elapsed } from '@/features/library/elapsed';
import { CoverImage } from '@/features/source/source-cover';
import { orderAfterPress, type SourceOrder, type SourceSort, stepSelection } from '@/features/source/source-order';
import { coverSizes } from '@/features/source/template-cover';
import type { Cover } from '@/features/source/cover';

type ListedSource = inferRouterOutputs<AppRouter>['sources']['list'][number];
type Column = 'type' | 'title' | 'author' | 'date' | 'notes' | 'last';
type RowRef = ComponentRef<typeof Pressable>;

/**
 * The row chosen with ↑↓ in a wide Kaynaklar, by its Source's id. A row
 * no longer in `ids` (the other tab, a filter) counts as none chosen. `step`
 * moves to the next or previous row and puts the focus on it, so ↵ opens it
 * and the list scrolls to it.
 */
export function useRowSelection(ids: readonly string[]) {
  const [chosen, setChosen] = useState<string | null>(null);
  const rows = useRef(new Map<string, RowRef>());
  const selected = chosen !== null && ids.includes(chosen) ? chosen : null;
  return {
    selected,
    select: setChosen,
    step: (direction: 'previous' | 'next') => {
      const next = stepSelection(ids, selected, direction);
      setChosen(next);
      if (next) rows.current.get(next)?.focus();
    },
    /** The ref a row gives, so the focus can be put on it. */
    rowRef: (id: string) => (row: RowRef | null) => {
      if (row) rows.current.set(id, row);
      else rows.current.delete(id);
    },
  };
}

type Selection = ReturnType<typeof useRowSelection>;

/**
 * Kaynaklar on a wide screen (#179): Tür, Başlık with its 24 × 34 Cover at
 * the left (the room left empty without one), Yazar, Tarih, Not and Son
 * not. Başlık, Yazar, Tarih and Son not sort, by the orders `sources.list`
 * has; a second press turns the order round. A row, or ↵ on the chosen one,
 * opens the Source page.
 */
export function SourceTable({
  sources,
  order,
  onOrder,
  selection,
  onOpen,
  header,
  empty,
  density = 'full',
}: {
  /** `compact` beside a panel (#180): Tür, Başlık, Yazar and Not only, as R6-Final-F has it. */
  density?: Density;
  /** In `order`. */
  sources: readonly ListedSource[];
  order: SourceOrder;
  onOrder: (order: SourceOrder) => void;
  selection: Selection;
  onOpen: (id: string) => void;
  /** Under the headings, above the rows (the hidden undated). */
  header?: ReactElement;
  /** In place of the rows while there are none. */
  empty: ReactElement;
}) {
  const { t } = useTranslation();
  const sortBy = (sort: SourceSort) => () => onOrder(orderAfterPress(order, sort));
  const all: TableColumn<Column>[] = [
    { key: 'type', label: t('sourceTable.type'), width: 110 },
    { key: 'title', label: t('sources.byTitle'), onSort: sortBy('title') },
    { key: 'author', label: t('sources.byAuthor'), width: 150, onSort: sortBy('author') },
    { key: 'date', label: t('sources.byDate'), width: 130, onSort: sortBy('date') },
    { key: 'notes', label: t('sourceTable.notes'), width: 56, align: 'end' },
    { key: 'last', label: t('sourceList.byLast'), width: 120, onSort: sortBy('last') },
  ];
  const columns = density === 'compact' ? all.filter(({ key }) => key !== 'date' && key !== 'last') : all;
  const sort = { column: order.sort, direction: order.direction };

  return (
    <View className="min-h-0 flex-1 px-5 pt-sm">
      <Table label={t('sourceTable.label')}>
        <FlatList
          className="flex-1"
          contentContainerClassName="grow pb-xxl"
          data={sources}
          keyExtractor={(source) => source.id}
          // In the list, so a scrollbar narrows the headings as it narrows the rows; it stays on top.
          ListHeaderComponent={
            <View className="bg-page">
              <TableHead columns={columns} sort={sort} />
              {header}
            </View>
          }
          stickyHeaderIndices={[0]}
          ListEmptyComponent={empty}
          renderItem={({ item: source }) => (
            <TableRow
              ref={selection.rowRef(source.id)}
              columns={columns}
              selected={selection.selected === source.id}
              onFocus={() => selection.select(source.id)}
              onPress={() => {
                selection.select(source.id);
                onOpen(source.id);
              }}
              cells={{
                type: <Text variant="micro">{t(`sourceTypes.${source.type}.label`)}</Text>,
                title: (
                  <View className="flex-row items-center gap-2.5 self-stretch">
                    <TableCover cover={source.cover} />
                    <Text variant="sourceTitleSm" numberOfLines={2} className="min-w-0 flex-1">
                      {source.title}
                    </Text>
                  </View>
                ),
                author: (
                  <Text variant="bodySm" color="ink3" numberOfLines={1}>
                    {source.author ?? t('sourceTable.none')}
                  </Text>
                ),
                date: (
                  <Text variant="bodySm" color="ink3" numberOfLines={1}>
                    {source.date ? formatDate(source.date) : t('sourceTable.undated')}
                  </Text>
                ),
                notes: <Text variant="locator">{source.noteCount}</Text>,
                last: (
                  <Text variant="bodySm" color="ink2" numberOfLines={1}>
                    {source.lastNoteAt ? elapsed(t, source.lastNoteAt) : t('sourceTable.none')}
                  </Text>
                ),
              }}
            />
          )}
        />
      </Table>
    </View>
  );
}

/** The Cover at 24 × 34, or the same room left empty: no template in a table row. */
function TableCover({ cover }: { cover: Cover | null }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!cover || failed === cover.small) return <View style={coverSizes.table} />;
  return <CoverImage file={cover.small} style={coverSizes.table} onFailed={() => setFailed(cover.small)} />;
}

/** The keys a wide Kaynaklar hears, at its foot: ↑↓ kaynak, ↵ sayfasını aç, N seçili kaynağa not al. */
export function SourceTableKeys() {
  const { t } = useTranslation();
  const keys = [
    ['↑↓', t('sourceTable.keyRows')],
    ['↵', t('sourceTable.keyOpen')],
    ['N', t('sourceTable.keyCapture')],
  ] as const;
  return (
    <View className="flex-row gap-md border-t border-line px-xxl py-sm">
      {keys.map(([key, does]) => (
        <View key={key} className="flex-row items-center gap-1.5">
          <View className="rounded-chip border border-line bg-surface px-1.25">
            <Text variant="count" color="ink2">
              {key}
            </Text>
          </View>
          <Text variant="caption" color="ink2">
            {does}
          </Text>
        </View>
      ))}
    </View>
  );
}
