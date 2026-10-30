/**
 * When a Note was captured: the device's clock at the time, which its
 * UUIDv7 id carries in its first 48 bits (ADR-0008).
 */
export function capturedAt(id: string): Date {
  return new Date(parseInt(id.replaceAll('-', '').slice(0, 12), 16));
}

/** Capture order, oldest first: the order of the Notes' UUIDv7 ids (ADR-0008). */
export function byCapture(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
