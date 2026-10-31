// The device's outbox (ADR-0008): operations wait here, in the order they
// were made, until the server confirms them. Storage and transport sit behind
// interfaces, so the queue is tested in memory and runs on expo-sqlite.
export { type OpenOutbox, openOutbox, type Outbox, type OutboxState } from './lib/outbox';
export { type KnownNote, type ListedNote, pendingNote, withPendingNotes } from './lib/pending-notes';
export type { NoteStatus, Operation, OutboxStorage, Receipt, Reply, StoredOperation, Transport } from './lib/types';
