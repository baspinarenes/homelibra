import { type CalendarDate, formatDate } from '@homelibra/core/date';
import { tagSuggestKey } from '@homelibra/core/tag';
import type { QuickSearchMark, QuickSearchResult } from '@homelibra/ui/quick-search';

/** How many of each kind the quick search window shows: a few, Ara has the rest. */
const few = { tags: 3, sources: 3, notes: 4 } as const;

type Tag = { id: string; name: string; noteCount: number; sourceCount: number };
type Source = { id: string; title: string; author: string | null; date: CalendarDate | null };
type Note = { id: string; locator: string | null; snippet: readonly QuickSearchMark[] };

/**
 * The quick search window's results for `query`: the Tags whose name has
 * the query's words in it, folded as the Tag picker folds them (Ara does
 * not search Tags; `tags.list`, best used first), and the first Sources and
 * Notes of Ara's own search (`search.library`), in Ara's order.
 */
export function quickResults(
  {
    query,
    tags,
    search,
  }: {
    query: string;
    tags: readonly Tag[];
    search: { sources: readonly Source[]; notes: readonly Note[] } | undefined;
  },
  { tagDetail }: { tagDetail: (tag: Tag) => string },
): QuickSearchResult[] {
  const key = tagSuggestKey(query);
  if (key === '') return [];
  return [
    ...tags
      .filter((tag) => tagSuggestKey(tag.name).includes(key))
      .slice(0, few.tags)
      .map((tag) => ({ kind: 'tag' as const, id: tag.id, name: tag.name, detail: tagDetail(tag) })),
    ...(search?.sources ?? []).slice(0, few.sources).map((source) => ({
      kind: 'source' as const,
      id: source.id,
      title: source.title,
      // Yazar · Tarih, the Date as it was entered.
      detail: [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · '),
    })),
    ...(search?.notes ?? []).slice(0, few.notes).map((note) => ({
      kind: 'note' as const,
      id: note.id,
      locator: note.locator,
      snippet: note.snippet,
    })),
  ];
}
