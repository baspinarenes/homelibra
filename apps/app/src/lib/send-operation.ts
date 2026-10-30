import type { Operation } from '@homelibra/outbox';

import { queryClient, trpcClient, trpcOptions } from './trpc';

/**
 * Everywhere a Note shows: its Source's list, Ana sayfa, search, Etiketler,
 * Düzenlenecekler. Not a deleted Note's own notes.get: it would only fail
 * to load (and try again) while its screen goes.
 */
const refreshNotes = (operation: Operation) =>
  Promise.all([
    queryClient.invalidateQueries({
      queryKey: operation.type === 'deleteNote' ? trpcOptions.notes.list.pathKey() : trpcOptions.notes.pathKey(),
    }),
    queryClient.invalidateQueries({ queryKey: trpcOptions.sources.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpcOptions.search.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpcOptions.tags.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpcOptions.organize.pathKey() }),
  ]);

/** The server's reply worth keeping: the token of a delete's or a move's Geri al. */
async function call(operation: Operation): Promise<{ undoToken?: string | null }> {
  switch (operation.type) {
    case 'createNote':
      await trpcClient.notes.create.mutate(operation.note);
      return {};
    case 'attachComment':
      // Its own Note, should the Excerpt's refuse it, is the outbox's to make.
      await trpcClient.notes.attachComment.mutate({
        id: operation.id,
        comment: operation.comment,
        tags: operation.tags,
      });
      return {};
    case 'detachComment':
      await trpcClient.notes.detachComment.mutate({ id: operation.id, commentNoteId: operation.commentNoteId });
      return {};
    case 'updateNote': {
      const { id, locator, locatorSort, excerpt, comment, tags } = operation;
      await trpcClient.notes.update.mutate({ id, locator, locatorSort, excerpt, comment, tags });
      return {};
    }
    case 'moveNote':
      return trpcClient.notes.move.mutate({ id: operation.id, sourceId: operation.sourceId });
    case 'deleteNote':
      return trpcClient.notes.delete.mutate({ id: operation.id });
  }
}

/**
 * Sends one operation through the API procedure of its name (the outbox has
 * no batch endpoint of its own, spec #40) and resolves once the Notes and
 * Sources on screen show it, so a Note never drops out of the list between
 * leaving the queue and arriving from the server.
 */
export async function sendOperation(operation: Operation) {
  const { undoToken = null } = await call(operation);
  await refreshNotes(operation);
  return { undoToken };
}

/** The server's Geri al for an operation sent already; every query refreshes, as what comes back shows everywhere. */
export async function undoOperation(token: string) {
  await trpcClient.undo.mutate({ token });
  await queryClient.invalidateQueries();
}
