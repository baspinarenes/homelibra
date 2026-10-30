import type { Operation } from '@homelibra/outbox';

import { queryClient, trpcClient, trpcOptions } from './trpc';

/**
 * Sends one operation through the API procedure of its name (the outbox has
 * no batch endpoint of its own, spec #40) and resolves once the Notes and
 * Sources on screen show it, so a Note never drops out of the list between
 * leaving the queue and arriving from the server.
 */
export async function sendOperation(operation: Operation) {
  switch (operation.type) {
    case 'createNote':
      await trpcClient.notes.create.mutate(operation.note);
      break;
    case 'attachComment':
      await trpcClient.notes.attachComment.mutate({ id: operation.id, comment: operation.comment });
      break;
    case 'detachComment':
      await trpcClient.notes.detachComment.mutate({ id: operation.id, commentNoteId: operation.commentNoteId });
      break;
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: trpcOptions.notes.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpcOptions.sources.pathKey() }),
  ]);
}
