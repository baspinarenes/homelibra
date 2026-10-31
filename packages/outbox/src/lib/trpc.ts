import { SOURCE_NOT_FOUND } from '@homelibra/core/errors';

import type { Operation, Reply, Transport } from './types';

type Of<T extends Operation['type']> = Omit<Extract<Operation, { type: T }>, 'type'>;

/** A tRPC mutation as the client offers it: its input in, its output back. */
type Mutation<Input, Output = unknown> = { mutate: (input: Input) => Promise<Output> };

/**
 * The procedures the outbox calls, as a tRPC client of the API has them.
 * The app's `TRPCClient<AppRouter>` must fit this shape, so its typecheck
 * tells when the API and the operations drift apart.
 */
type NotesClient = {
  notes: {
    create: Mutation<Of<'createNote'>['note']>;
    attachComment: Mutation<Omit<Of<'attachComment'>, 'ownNote'>>;
    detachComment: Mutation<Of<'detachComment'>>;
    update: Mutation<Of<'updateNote'>>;
    move: Mutation<Of<'moveNote'>, { undoToken: string | null }>;
    delete: Mutation<Of<'deleteNote'>, { undoToken: string | null }>;
  };
  undo: Mutation<{ token: string }>;
};

/** Sends the operation through the procedure of its name; resolves with the token of its Geri al, if it has one. */
async function call(client: NotesClient, operation: Operation): Promise<string | null> {
  switch (operation.type) {
    case 'createNote':
      await client.notes.create.mutate(operation.note);
      return null;
    case 'attachComment':
      // Its own Note, should the Excerpt's refuse it, is the outbox's to make.
      await client.notes.attachComment.mutate({ id: operation.id, comment: operation.comment, tags: operation.tags });
      return null;
    case 'detachComment':
      await client.notes.detachComment.mutate({ id: operation.id, commentNoteId: operation.commentNoteId });
      return null;
    case 'updateNote': {
      const { id, locator, locatorSort, excerpt, comment, tags } = operation;
      await client.notes.update.mutate({ id, locator, locatorSort, excerpt, comment, tags });
      return null;
    }
    case 'moveNote':
      return (await client.notes.move.mutate({ id: operation.id, sourceId: operation.sourceId })).undoToken;
    case 'deleteNote':
      return (await client.notes.delete.mutate({ id: operation.id })).undoToken;
  }
}

/** Answers the server will give an operation every time it is sent: waiting would not change them. */
const refusals = new Set(['BAD_REQUEST', 'NOT_FOUND', 'CONFLICT']);

/**
 * What the server's error says of the operation, read as a tRPC client error
 * is shaped: "kaynak yok", refused for good, or nothing when it says nothing
 * (a lost connection, a server error, an expired session).
 */
function refusalOf(error: unknown): 'sourceGone' | 'refused' | null {
  if (typeof error !== 'object' || error === null) return null;
  const { message, data } = error as { message?: unknown; data?: { code?: unknown } | null };
  const code = data?.code;
  if (typeof code !== 'string') return null;
  if (message === SOURCE_NOT_FOUND) return 'sourceGone';
  return refusals.has(code) ? 'refused' : null;
}

/** An operation the server refused, as the web's `apply` rejects with it: it has no outbox to keep it in. */
export class OperationRefused extends Error {
  readonly outcome: 'refused' | 'sourceGone';
  constructor(outcome: 'refused' | 'sourceGone') {
    super(outcome === 'sourceGone' ? 'The Source is not in the Library' : 'The server refused the operation');
    this.name = 'OperationRefused';
    this.outcome = outcome;
  }
}

/**
 * The outbox's way to the API through a tRPC client. A lost connection, a
 * server error or an expired session reject, and the operation waits to be
 * sent again; a refusal the server would repeat is answered, so the queue
 * can go on.
 */
export function trpcTransport(client: NotesClient): Transport {
  return {
    async send(operation): Promise<Reply> {
      try {
        return { outcome: 'done', undoToken: await call(client, operation) };
      } catch (error) {
        const refusal = refusalOf(error);
        if (!refusal) throw error;
        return { outcome: refusal };
      }
    },
    async undo(token) {
      await client.undo.mutate({ token });
    },
  };
}
