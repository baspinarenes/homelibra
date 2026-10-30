import { and, eq, inArray } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { noteTag, sourceTag, tag } from '../db/schema';

/**
 * The Tags on some Notes and Sources, as an undo log keeps them (#48): every
 * link, and every Tag they point at, whether or not deleting the carriers
 * leaves it unused. Plain JSON, so it sits in a jsonb snapshot as it is.
 */
export type TagSnapshot = {
  tags: { id: string; name: string; identity: string }[];
  noteTags: { noteId: string; tagId: string; createdAt: string }[];
  sourceTags: { sourceId: string; tagId: string; createdAt: string }[];
};

/**
 * Taken before Notes or Sources are deleted. Their links cascade with them,
 * and a Tag left unused goes too (0012_tags), so this is what brings both back.
 */
export async function tagSnapshot(
  tx: LibraryTx,
  accountId: string,
  { noteIds = [], sourceIds = [] }: { noteIds?: string[]; sourceIds?: string[] },
): Promise<TagSnapshot> {
  const noteTags =
    noteIds.length === 0
      ? []
      : await tx
          .select({ noteId: noteTag.noteId, tagId: noteTag.tagId, createdAt: noteTag.createdAt })
          .from(noteTag)
          .where(and(inArray(noteTag.noteId, noteIds), eq(noteTag.accountId, accountId)));
  const sourceTags =
    sourceIds.length === 0
      ? []
      : await tx
          .select({ sourceId: sourceTag.sourceId, tagId: sourceTag.tagId, createdAt: sourceTag.createdAt })
          .from(sourceTag)
          .where(and(inArray(sourceTag.sourceId, sourceIds), eq(sourceTag.accountId, accountId)));
  const tagIds = [...new Set([...noteTags, ...sourceTags].map((link) => link.tagId))];
  const tags =
    tagIds.length === 0
      ? []
      : await tx
          .select({ id: tag.id, name: tag.name, identity: tag.identity })
          .from(tag)
          .where(and(inArray(tag.id, tagIds), eq(tag.accountId, accountId)));
  return {
    tags,
    noteTags: noteTags.map((link) => ({ ...link, createdAt: link.createdAt.toISOString() })),
    sourceTags: sourceTags.map((link) => ({ ...link, createdAt: link.createdAt.toISOString() })),
  };
}

/**
 * Puts the links back once their Notes and Sources are back, bringing back
 * the Tags that went with them. A Tag named again meanwhile under the same
 * identity is a new Tag by now: the links go to it, under its new spelling.
 */
export async function restoreTags(tx: LibraryTx, accountId: string, snapshot: TagSnapshot) {
  if (snapshot.tags.length === 0) return;
  await tx
    .insert(tag)
    .values(snapshot.tags.map((row) => ({ ...row, accountId })))
    .onConflictDoNothing();
  const current = await tx
    .select({ id: tag.id, identity: tag.identity })
    .from(tag)
    .where(
      and(
        eq(tag.accountId, accountId),
        inArray(
          tag.identity,
          snapshot.tags.map((row) => row.identity),
        ),
      ),
    );
  const byIdentity = new Map(current.map((row) => [row.identity, row.id]));
  const now = new Map(snapshot.tags.map((row) => [row.id, byIdentity.get(row.identity)!]));
  if (snapshot.noteTags.length > 0)
    await tx
      .insert(noteTag)
      .values(
        snapshot.noteTags.map((link) => ({
          ...link,
          tagId: now.get(link.tagId)!,
          createdAt: new Date(link.createdAt),
          accountId,
        })),
      )
      .onConflictDoNothing();
  if (snapshot.sourceTags.length > 0)
    await tx
      .insert(sourceTag)
      .values(
        snapshot.sourceTags.map((link) => ({
          ...link,
          tagId: now.get(link.tagId)!,
          createdAt: new Date(link.createdAt),
          accountId,
        })),
      )
      .onConflictDoNothing();
}
