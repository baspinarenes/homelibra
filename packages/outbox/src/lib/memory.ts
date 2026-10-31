import type { OutboxStorage, StoredOperation } from './types';

/** The device's outbox table, in memory: survives an Outbox being opened again on it. */
export function memoryStorage(): OutboxStorage & { rows: StoredOperation[] } {
  const rows: StoredOperation[] = [];
  let next = 1;
  return {
    rows,
    async list() {
      return rows.map((row) => ({ ...row }));
    },
    async add(operation) {
      const row = { seq: next++, operation };
      rows.push(row);
      return row.seq;
    },
    async replace(seq, operation) {
      const row = rows.find((r) => r.seq === seq);
      if (row) row.operation = operation;
    },
    async remove(seq) {
      const index = rows.findIndex((row) => row.seq === seq);
      if (index >= 0) rows.splice(index, 1);
    },
  };
}
