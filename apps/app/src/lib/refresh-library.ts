import type { Query } from '@tanstack/react-query';

import { queryClient, trpcOptions } from './trpc';

/**
 * Everywhere a Source or a Note shows: Source pages and lists (Kaynaklar,
 * Ana sayfa, Okunuyor), search, Etiketler and tag pages, Düzenlenecekler and
 * the tab badge, Collections.
 */
const showingLibrary = [
  trpcOptions.notes,
  trpcOptions.sources,
  trpcOptions.search,
  trpcOptions.tags,
  trpcOptions.organize,
  trpcOptions.collections,
];

const inputOf = (query: Query) => ((query.queryKey as unknown[])[1] as { input?: Record<string, unknown> })?.input;

/**
 * After a Source or Note changes, came back or went: refreshes everything that
 * shows one, so it shows the change everywhere (or drops out everywhere).
 * `gone` is the id of a Source or Note just deleted: its own queries (its
 * page, its Notes, its Düzenle mode) are left alone, as they would only fail
 * to load, and try again, while its screen goes.
 */
export function refreshLibrary(gone?: string) {
  const ofGone = (query: Query) => {
    const input = inputOf(query);
    return gone !== undefined && (input?.id === gone || input?.sourceId === gone);
  };
  return Promise.all(
    showingLibrary.map((router) =>
      queryClient.invalidateQueries({ queryKey: router.pathKey(), predicate: (query) => !ofGone(query) }),
    ),
  );
}
