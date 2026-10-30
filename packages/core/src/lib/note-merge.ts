import { compareNotes, type Placeable } from './locator-order';
import { tagIdentity } from './tag-identity';

/** What a Note brings to a Note merge: its place, its texts and its own Tags by name. */
export type Mergeable = Placeable & {
  excerpt: string | null;
  comment: string | null;
  tags: readonly string[];
};

/** What a Note merge leaves: the first Note, in Locator order, holding everything. */
export type Merged = {
  /** The first Note's: the merged Note takes its place, and keeps its capture time. */
  id: string;
  locator: string | null;
  locatorSort: readonly number[] | null;
  excerpt: string | null;
  comment: string | null;
  tags: string[];
};

// "paragraf arasıyla": one blank line between the parts.
const paragraphs = (texts: (string | null)[]) =>
  texts.filter((text) => text !== null && text !== '').join('\n\n') || null;

/**
 * Note merge (#13): the Excerpts, and the Comments, in Locator order with a
 * paragraph between them; the Tags pooled, each identity once, as first
 * met; the Locator, and its sort value, of the first Note. The merge
 * preview and the server both make it this way.
 */
export function mergeNotes(notes: readonly Mergeable[]): Merged {
  const ordered = [...notes].sort(compareNotes);
  const first = ordered[0];
  if (!first) throw new Error('A Note merge needs Notes');
  const tags = new Map<string, string>();
  for (const name of ordered.flatMap((note) => note.tags)) {
    const identity = tagIdentity(name);
    if (!tags.has(identity)) tags.set(identity, name);
  }
  return {
    id: first.id,
    locator: first.locator,
    locatorSort: first.locatorSort,
    excerpt: paragraphs(ordered.map((note) => note.excerpt)),
    comment: paragraphs(ordered.map((note) => note.comment)),
    tags: [...tags.values()],
  };
}
