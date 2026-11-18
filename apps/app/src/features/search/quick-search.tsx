import { QuickSearch, type QuickSearchResult } from '@homelibra/ui/quick-search';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { quickResults } from '@/features/search/quick-results';
import { useSettled } from '@/features/search/settled';
import { useOffline } from '@/lib/network';
import { useTRPC } from '@/lib/trpc';

/**
 * The quick search window (⌘K, #175): Ara's own search, not one of its own.
 * Its Sources and Notes are the first of `search.library` asked as Ara asks
 * it, so Ara opened with the same query shows them at once; its Tags are
 * `tags.list` narrowed here, as Ara does not search Tags. A row opens its
 * Tag, Source or Note; "Ara'da tüm sonuçlar" hands the query to
 * `onSearchAll`. Mounted while open: each opening starts with an empty box.
 */
export function QuickSearchWindow({
  onClose,
  onSearchAll,
}: {
  onClose: () => void;
  /** Ara with the query as typed ('' for Ara as it is). */
  onSearchAll: (query: string) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const offline = useOffline();
  const [text, setText] = useState('');
  const typed = text.trim();
  const query = useSettled(typed);
  const search = useInfiniteQuery({
    // Ara's search with no Tarih filter: the same query key, so the same cache.
    ...trpc.search.library.infiniteQueryOptions(
      { query, dates: null },
      { getNextPageParam: (page) => page.nextCursor },
    ),
    enabled: query !== '' && !offline,
    placeholderData: keepPreviousData,
  });
  const tags = useQuery({ ...trpc.tags.list.queryOptions({ sort: 'usage' }), enabled: !offline });
  const first = search.data?.pages[0];

  const results = useMemo(
    () =>
      quickResults(
        { query, tags: tags.data ?? [], search: first },
        { tagDetail: (tag) => t('tags.counts', { notes: tag.noteCount, sources: tag.sourceCount }) },
      ),
    [query, tags.data, first, t],
  );

  const message = offline
    ? t('outbox.searchNeedsConnection')
    : query === ''
      ? null
      : search.isError
        ? t('search.failed')
        : !search.isPending && results.length === 0
          ? t('search.empty')
          : null;

  const open = (result: QuickSearchResult) => {
    onClose();
    if (result.kind === 'tag') router.push({ pathname: '/tag/[id]', params: { id: result.id } });
    else if (result.kind === 'source') router.push({ pathname: '/source/[id]', params: { id: result.id } });
    else {
      const sourceId = first?.notes.find((note) => note.id === result.id)?.sourceId;
      if (sourceId) router.push({ pathname: '/source/[id]', params: { id: sourceId, note: result.id } });
    }
  };

  return (
    <QuickSearch
      visible
      query={text}
      onChangeQuery={setText}
      results={results}
      message={message}
      // Typing ahead of the results, or the next query's still on its way.
      stale={typed !== query || search.isPlaceholderData}
      labels={{
        dialog: t('quickSearch.dialog'),
        field: t('quickSearch.field'),
        placeholder: t('quickSearch.placeholder'),
        close: t('quickSearch.close'),
        go: t('quickSearch.go'),
        notes: t('quickSearch.notes'),
        tag: t('quickSearch.tag'),
        source: t('quickSearch.source'),
        openAll: typed === '' ? t('quickSearch.openAra') : t('quickSearch.openAll', { query: typed }),
        select: t('quickSearch.select'),
        open: t('quickSearch.open'),
        openAllHint: t('quickSearch.openAllHint'),
      }}
      onOpen={open}
      onOpenAll={() => {
        onClose();
        onSearchAll(typed);
      }}
      onClose={onClose}
    />
  );
}
