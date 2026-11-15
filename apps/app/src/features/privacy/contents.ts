import type { LegalSection } from '@/features/privacy/legal';

/** Fewer headings than this, and a text is short enough to read without a list of them. */
const fewestHeadings = 3;

/**
 * The headings a legal text lists beside itself on a wide screen (#185), or
 * null when it has too few for the list to help.
 */
export function contentsOf(sections: LegalSection[]): string[] | null {
  if (sections.length < fewestHeadings) return null;
  return sections.map((section) => section.heading);
}

/** Where a text is scrolled: its sections' tops, how far down it is, the window's height and its own. */
export type ReadingPlace = { tops: number[]; offset: number; viewport: number; content: number };

/**
 * The section being read: the last whose heading has reached the top of the
 * window, or the last of all once the window has reached the text's end,
 * where a short closing section's heading never climbs that far.
 */
export function sectionAt({ tops, offset, viewport, content }: ReadingPlace): number {
  // A pixel's grace: a scroll on the web stops on a fraction short of the end or of a top.
  if (offset + viewport >= content - 1) return tops.length - 1;
  return tops.reduce((reading, top, i) => (top <= offset + 1 ? i : reading), 0);
}
