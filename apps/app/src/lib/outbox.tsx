import type { Operation, OutboxState, Receipt } from '@homelibra/outbox';
import { OperationRefused } from '@homelibra/outbox/trpc';
import type { ReactNode } from 'react';

import { libraryTransport } from './library-transport';

// The web has no outbox and works online only (ADR-0008): an operation goes
// straight to the API, and a failure comes back to the screen that applied
// it. The phone's outbox is outbox.native.tsx, behind the same interface.

export type ApplyOperation = (operation: Operation) => Promise<Receipt>;

const nothingWaiting: OutboxState = { pending: [], status: new Map(), waiting: 0 };

export function OutboxProvider({ children }: { children: ReactNode }) {
  return children;
}

/** Sent at once, through the phone outbox's Transport: a refusal rejects as OperationRefused, a lost connection as it is. */
const apply: ApplyOperation = async (operation) => {
  const reply = await libraryTransport.send(operation);
  if (reply.outcome !== 'done') throw new OperationRefused(reply.outcome);
  const { undoToken } = reply;
  return { undo: undoToken ? () => libraryTransport.undo(undoToken) : null };
};
/** Nothing waits on the web. */
const drain = async () => 0;

/**
 * "İşlemi uygula", the screens' one way to change Notes, and what is
 * waiting to be sent. A screen does not know whether it is online: `apply`
 * resolves once the operation is safe (sent here, queued on the phone) and
 * rejects when it is not. `drain` sends what waits, before an online-only
 * operation such as Düzenle mode; it resolves with how many Notes still wait.
 */
export function useOutbox(): { apply: ApplyOperation; state: OutboxState; drain: () => Promise<number> } {
  return { apply, state: nothingWaiting, drain };
}
