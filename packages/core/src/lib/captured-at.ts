/**
 * When a Note was captured: the device's clock at the time, which its
 * UUIDv7 id carries in its first 48 bits (ADR-0008).
 */
export function capturedAt(id: string): Date {
  return new Date(parseInt(id.replaceAll('-', '').slice(0, 12), 16));
}
