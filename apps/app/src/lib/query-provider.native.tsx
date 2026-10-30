import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import Storage from 'expo-sqlite/kv-store';
import type { ReactNode } from 'react';

import { queryClient, trpcOptions } from './trpc';

// Spec #40 (decision on #57): so Capture works offline, the phone keeps the
// Source lists and the last few Source pages' Notes between launches. A
// read-only cache, not a sync: the outbox's waiting Notes are laid over it.

/** How long the kept cache is good for, and how long those queries stay in memory unused. */
const keptFor = 7 * 24 * 60 * 60_000;

/** The Source pages whose Notes are kept: the ones opened last. */
const keptSourcePages = 5;

const sourceLists = [trpcOptions.sources.home, trpcOptions.sources.lastNoted, trpcOptions.sources.list];
const sourcePage = [trpcOptions.sources.get, trpcOptions.notes.list];

for (const procedure of [...sourceLists, ...sourcePage]) {
  queryClient.setQueryDefaults(procedure.pathKey(), { gcTime: keptFor });
}

const pathOf = (query: Query) => JSON.stringify((query.queryKey as unknown[])[0]);
const inputOf = (query: Query) => ((query.queryKey as unknown[])[1] as { input?: Record<string, string> })?.input;
const isOf = (query: Query, procedure: { pathKey: () => readonly unknown[] }) =>
  pathOf(query) === JSON.stringify(procedure.pathKey()[0]);

/** The Sources whose pages were loaded last. */
function recentSourcePages() {
  const pages = queryClient
    .getQueryCache()
    .findAll({ queryKey: trpcOptions.notes.list.pathKey() })
    .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
    .slice(0, keptSourcePages);
  return new Set(pages.map((query) => inputOf(query)?.sourceId));
}

function kept(query: Query) {
  if (query.state.status !== 'success') return false;
  if (sourceLists.some((procedure) => isOf(query, procedure))) return true;
  const sourceId = isOf(query, trpcOptions.notes.list)
    ? inputOf(query)?.sourceId
    : isOf(query, trpcOptions.sources.get)
      ? inputOf(query)?.id
      : undefined;
  return sourceId !== undefined && recentSourcePages().has(sourceId);
}

const persister = createAsyncStoragePersister({ storage: Storage, key: 'homelibra-query-cache' });

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: keptFor, dehydrateOptions: { shouldDehydrateQuery: kept } }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

/** Signing out: nothing of the Library stays behind, in memory or on the phone. */
export async function forgetQueries() {
  queryClient.clear();
  await persister.removeClient();
}
