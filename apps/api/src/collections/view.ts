import { compareTr } from '@homelibra/core';
import { compareNotes } from '@homelibra/core/note';
import { and, eq, inArray, sql } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { collection, collectionTag, note, noteTag, source, sourceTag } from '../db/schema';
import type { TagRef } from '../tags/tags';

/**
 * Why a Note is in a view: its own Tags that are in the definition, or,
 * when it carries none of them, its Source's (shown "kaynak: X").
 */
export type Why = { via: 'note' | 'source'; tags: TagRef[] };

/**
 * A Collection's view, or a Tag page's (the same view of one Tag, unsaved):
 * the member Notes grouped by Source in reading order (#3), with the counts
 * the top bar shows.
 */
export async function collectionView(
  tx: LibraryTx,
  accountId: string,
  { tags, includeSourceNotes }: { tags: TagRef[]; includeSourceNotes: boolean },
) {
  const empty = { groups: [], noteCount: 0, sourceCount: 0, sourceOnlyCount: 0 };
  if (tags.length === 0) return empty;
  const tagIds = tags.map((tag) => tag.id);
  // Spelled out with aliases: drizzle may leave a one-table select's columns unqualified.
  const ids = sql`array[${sql.join(
    tagIds.map((id) => sql`${id}`),
    sql`, `,
  )}]::uuid[]`;
  const ownTags = sql<string[]>`array(
    select l.tag_id from ${noteTag} l
     where l.note_id = ${note}.id and l.account_id = ${accountId} and l.tag_id = any(${ids}))`;
  const sourceTags = sql<string[]>`array(
    select l.tag_id from ${sourceTag} l
     where l.source_id = ${note}.source_id and l.account_id = ${accountId} and l.tag_id = any(${ids}))`;
  // Every Note reached either way; which way decides below, once per Note.
  const candidates = await tx
    .select({
      id: note.id,
      sourceId: note.sourceId,
      locator: note.locator,
      locatorSort: note.locatorSort,
      excerpt: note.excerpt,
      comment: note.comment,
      ownTags,
      sourceTags,
    })
    .from(note)
    .where(and(eq(note.accountId, accountId), sql`(cardinality(${ownTags}) > 0 or cardinality(${sourceTags}) > 0)`));

  const byId = new Map(tags.map((tag) => [tag.id, tag]));
  const refs = (ids: string[]) => ids.map((id) => byId.get(id)!).sort((a, b) => compareTr(a.name, b.name));
  // Notes that only their Source's Tag brings: "+N not", whether the switch is on or off.
  const sourceOnlyCount = candidates.filter((n) => n.ownTags.length === 0).length;
  const members = candidates
    .filter((n) => n.ownTags.length > 0 || includeSourceNotes)
    .map(({ ownTags: own, sourceTags: theirs, ...n }) => ({
      ...n,
      why: (own.length > 0 ? { via: 'note', tags: refs(own) } : { via: 'source', tags: refs(theirs) }) as Why,
    }));
  if (members.length === 0) return { ...empty, sourceOnlyCount };

  const sources = await tx
    .select({
      id: source.id,
      type: source.type,
      title: source.title,
      author: source.author,
      date: source.date,
      dateSort: source.dateSort,
    })
    .from(source)
    .where(and(eq(source.accountId, accountId), inArray(source.id, [...new Set(members.map((n) => n.sourceId))])));
  const groups = sources.sort(readingOrder).map(({ dateSort: _, ...group }) => ({
    source: group,
    notes: members
      .filter((n) => n.sourceId === group.id)
      .sort(compareNotes)
      .map(({ sourceId: _s, locatorSort: _l, ...n }) => n),
  }));
  return { groups, noteCount: members.length, sourceCount: groups.length, sourceOnlyCount };
}

/**
 * The Notes a Collection's view or a Tag's page shows now: exactly those
 * of {@link collectionView}, so searching it narrows what is on screen.
 */
export async function viewNoteIds(
  tx: LibraryTx,
  accountId: string,
  definition: { tags: TagRef[]; includeSourceNotes: boolean },
) {
  const { groups } = await collectionView(tx, accountId, definition);
  return groups.flatMap((group) => group.notes.map((n) => n.id));
}

/**
 * How many Notes a Collection's view shows now, for a query over
 * `collection`: the same membership as {@link collectionView}, counted in SQL.
 */
// Spelled out with aliases: drizzle leaves a one-table select's columns unqualified.
export const memberCount = sql<number>`(
  select count(*) from ${note} n
   where n.account_id = ${collection}.account_id
     and (exists (
           select from ${noteTag} nt join ${collectionTag} ct on ct.tag_id = nt.tag_id
            where nt.note_id = n.id and ct.collection_id = ${collection}.id)
       or (${collection}.include_source_notes and exists (
           select from ${sourceTag} st join ${collectionTag} ct on ct.tag_id = st.tag_id
            where st.source_id = n.source_id and ct.collection_id = ${collection}.id))))::int`;

type Ordered = { title: string; author: string | null; dateSort: number | null };

/**
 * Source groups by Date, oldest first (ADR-0002's Milâdî value), then by
 * Yazar and Başlık; Sources without a Date last, by Yazar and Başlık. A
 * missing Yazar sorts after the rest, as in Kaynaklar.
 */
function readingOrder(a: Ordered, b: Ordered) {
  return (
    lastWhenNull(a.dateSort, b.dateSort, (x, y) => x - y) ||
    lastWhenNull(a.author, b.author, compareTr) ||
    compareTr(a.title, b.title)
  );
}

function lastWhenNull<T>(a: T | null, b: T | null, compare: (a: T, b: T) => number) {
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  return compare(a, b);
}
