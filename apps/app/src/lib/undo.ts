import { UNDO_CONFLICT, UNDO_EXPIRED } from '@homelibra/core/errors';
import { TRPCClientError } from '@trpc/client';
import { useSyncExternalStore } from 'react';

import i18n from '@/i18n';
import { queryClient, trpcClient } from '@/lib/trpc';

/**
 * What was just done and how to take it back; without `undo`, only a word
 * on how it went. A new offer replaces the one on screen.
 */
export type UndoOffer = { message: string; undo?: () => void };

// One offer for the whole app: a screen that deletes often leaves before its
// Geri al bar would show, and the screen it goes back to shows it instead.
let current: UndoOffer | null = null;
const listeners = new Set<() => void>();

/** Shows `offer` in the Geri al bar of whichever screen is in front; null takes it away. */
export function offerUndo(offer: UndoOffer | null) {
  current = offer;
  for (const listener of listeners) listener();
}

/** The offer the Geri al bar shows now. */
export function useUndoOffer() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

/** The server no longer has the operation's Geri al, or what it took cannot go back. */
const undoGone = (error: unknown) =>
  error instanceof TRPCClientError && [UNDO_EXPIRED, UNDO_CONFLICT].includes(error.message);

/**
 * Offers Geri al for an operation the server took a snapshot of: the token
 * it returned goes back to `undo`, and every query refreshes, since a
 * Source or Note coming back shows up in lists, search and Ana sayfa alike.
 */
export function offerServerUndo(message: string, token: string | null) {
  offerReceiptUndo(
    message,
    token ? () => trpcClient.undo.mutate({ token }).then(() => queryClient.invalidateQueries()) : null,
  );
}

/**
 * Offers the Geri al an operation applied through the outbox handed back
 * (out of the queue while it waits, or the server's once it was sent); none
 * when there is none.
 */
export function offerReceiptUndo(message: string, undo: (() => Promise<void>) | null) {
  if (!undo) return;
  const take = () =>
    undo().catch((error: unknown) =>
      offerUndo(undoGone(error) ? { message: i18n.t('undo.gone') } : { message: i18n.t('undo.failed'), undo: take }),
    );
  offerUndo({ message, undo: take });
}
