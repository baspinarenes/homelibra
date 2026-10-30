import type { KnownNote, ListedNote } from '@homelibra/outbox';

import { queryClient, trpcOptions } from './trpc';

type Fetched = ListedNote & { sourceId: string };

/**
 * Every Note the phone has seen, from the Source pages' lists and the Notes
 * opened for editing it keeps (the kept cache, offline too), each with its
 * Source. Not a copy of the Library: what was never loaded is not here.
 */
export function knownNotes(): KnownNote[] {
  const listed = queryClient
    .getQueriesData<ListedNote[]>({ queryKey: trpcOptions.notes.list.pathKey() })
    .flatMap(([key, notes]) => {
      const sourceId = (key[1] as { input?: { sourceId?: string } } | undefined)?.input?.sourceId;
      return notes && sourceId ? notes.map((note) => ({ ...note, sourceId })) : [];
    });
  const opened = queryClient
    .getQueriesData<Fetched>({ queryKey: trpcOptions.notes.get.pathKey() })
    .flatMap(([, note]) => (note ? [note] : []));
  return [...listed, ...opened];
}
