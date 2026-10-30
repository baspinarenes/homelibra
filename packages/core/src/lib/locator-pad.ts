import type { SourceType } from './source-layout';

/**
 * The keys Capture offers for writing a Locator, by how the Source type is
 * cited (GLOSSARY.md, Source types). The prefix goes in front of the first
 * key. The result is still free text, so nothing here limits what a
 * Locator may hold.
 */
export type LocatorPad = { prefix: string; keys: readonly string[] };

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const page: LocatorPad = { prefix: 's. ', keys: [...digits, '–', '0'] };
const folio: LocatorPad = { prefix: 'vr. ', keys: [...digits, 'a', '0', 'b', '–'] };
const time: LocatorPad = { prefix: '', keys: [...digits, ':', '0'] };

const pads: Record<SourceType, LocatorPad | null> = {
  book: page,
  article: page,
  thesis: page,
  manuscript: folio,
  recording: time,
  // Document references, issues and pages, URLs: too varied for a pad.
  archive: null,
  periodical: null,
  webPage: null,
  other: null,
};

/** The pad for a Source type, or null where the Locator is typed as free text. */
export function locatorPad(type: SourceType): LocatorPad | null {
  return pads[type];
}

/** The erase key every pad has besides its own keys. */
export const locatorErase = '⌫';

/** The Locator after one key on the pad: a key or {@link locatorErase}. */
export function pressLocatorKey(pad: LocatorPad, locator: string, key: string): string {
  if (key !== locatorErase) return (locator === '' ? pad.prefix : locator) + key;
  const erased = locator.slice(0, -1);
  return erased === pad.prefix ? '' : erased;
}
