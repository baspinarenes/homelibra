import type { Operation, OutboxState } from '@homelibra/outbox';
import type { ReactNode } from 'react';

import { sendOperation } from './send-operation';

// The web has no outbox and works online only (ADR-0008): an operation goes
// straight to the API, and a failure comes back to the screen that applied
// it. The phone's outbox is outbox.native.tsx, behind the same interface.

export type ApplyOperation = (operation: Operation) => Promise<void>;

const nothingWaiting: OutboxState = { pending: [], status: new Map(), waiting: 0 };

export function OutboxProvider({ children }: { children: ReactNode }) {
  return children;
}

/**
 * "İşlemi uygula", the screens' one way to change Notes, and what is
 * waiting to be sent. A screen does not know whether it is online: `apply`
 * resolves once the operation is safe (sent here, queued on the phone) and
 * rejects when it is not.
 */
export function useOutbox(): { apply: ApplyOperation; state: OutboxState } {
  return { apply: sendOperation, state: nothingWaiting };
}
