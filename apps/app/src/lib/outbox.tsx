import type { Operation, OutboxState, Receipt } from '@homelibra/outbox';
import type { ReactNode } from 'react';

import { sendOperation, undoOperation } from './send-operation';

// The web has no outbox and works online only (ADR-0008): an operation goes
// straight to the API, and a failure comes back to the screen that applied
// it. The phone's outbox is outbox.native.tsx, behind the same interface.

export type ApplyOperation = (operation: Operation) => Promise<Receipt>;

const nothingWaiting: OutboxState = { pending: [], status: new Map(), waiting: 0 };

export function OutboxProvider({ children }: { children: ReactNode }) {
  return children;
}

const apply: ApplyOperation = async (operation) => {
  const { undoToken } = await sendOperation(operation);
  return { undo: undoToken ? () => undoOperation(undoToken) : null };
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
