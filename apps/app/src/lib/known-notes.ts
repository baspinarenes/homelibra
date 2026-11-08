import type { KnownNote, ListedNote } from '@homelibra/outbox';

import { queryClient, trpcOptions } from './trpc';

type Fetched = ListedNote & { sourceId: string };

/**
 * Every Note the phone has seen, from the Source pages' lists and the Notes
 * opened for editing it keeps (the kept cache, offline too), each with its
 * Source. Not a copy of the Library: what was never loaded is not here.
 *
 * A Note can be in several of these, and only what is on screen refetches
 * after a save. So they come oldest first, and the last copy of a Note, the
 * one that counts, is the one fetched last.
 */
export function knownNotes(): KnownNote[] {
  const cache = queryClient.getQueryCache();
  const listed = cache.findAll({ queryKey: trpcOptions.notes.list.pathKey() }).flatMap((query) => {
    const notes = query.state.data as ListedNote[] | undefined;
    const sourceId = (query.queryKey[1] as { input?: { sourceId?: string } } | undefined)?.input?.sourceId;
    const at = query.state.dataUpdatedAt;
    return notes && sourceId ? notes.map((note) => ({ at, note: { ...note, sourceId } })) : [];
  });
  const opened = cache.findAll({ queryKey: trpcOptions.notes.get.pathKey() }).flatMap((query) => {
    const note = query.state.data as Fetched | undefined;
    return note ? [{ at: query.state.dataUpdatedAt, note }] : [];
  });
  return [...listed, ...opened].sort((a, b) => a.at - b.at).map(({ note }) => note);
}
