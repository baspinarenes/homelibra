import { byCapture } from './captured-at';

/**
 * The Note captured last in a Source, whose Locator the writing sheet carries
 * over. Notes come in any order (the Source page lists them in Locator
 * order); their UUIDv7 ids are capture order (ADR-0008).
 */
export function lastCaptured<N extends { id: string }>(notes: readonly N[]): N | null {
  return [...notes].sort(byCapture).at(-1) ?? null;
}
