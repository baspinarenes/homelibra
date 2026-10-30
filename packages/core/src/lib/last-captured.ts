import { byCapture, capturedAt } from './captured-at';

export type LastCaptured<N> = {
  note: N;
  /** When the scholar started noting at its Locator without a break, so the box can ask "hâlâ burada mı?". */
  locatorSince: Date;
};

/**
 * The Note captured last in a Source, whose Locator the writing box carries
 * over, and since when that Locator has been in use. Notes come in any order
 * (the Source page lists them in Locator order); their UUIDv7 ids are
 * capture order (ADR-0008).
 */
export function lastCaptured<N extends { id: string; locator: string | null }>(
  notes: readonly N[],
): LastCaptured<N> | null {
  const inCaptureOrder = [...notes].sort(byCapture);
  const note = inCaptureOrder.at(-1);
  if (!note) return null;
  let runStart = note;
  for (const earlier of inCaptureOrder.toReversed().slice(1)) {
    if (earlier.locator !== note.locator) break;
    runStart = earlier;
  }
  return { note, locatorSince: capturedAt(runStart.id) };
}
