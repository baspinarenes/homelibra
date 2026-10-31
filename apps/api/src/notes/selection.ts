import { editedNote, mergeNotes, type NoteText } from '@homelibra/core/note';
import { TRPCError } from '@trpc/server';
import { and, eq, getTableName, inArray, ne } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { note, noteTag } from '../db/schema';
import { tagParts } from '../tags/snapshot';
import { tagsOfNotes } from '../tags/tags';
import { recordUndo, storedRow } from '../undo/undo';

/** How many Notes one call takes: far more than a Source's Düzenle mode shows. */
export const selectionLimit = 1000;

/** These Notes, those of them in this Library. */
const myNotes = (accountId: string, ids: string[]) => and(inArray(note.id, ids), eq(note.accountId, accountId));

/**
 * Deletes the Notes still there, with their Tag links and a Tag only they
 * carried; one token takes them all back. With none deleted there is no
 * Geri al (null).
 */
export async function deleteNotes(tx: LibraryTx, accountId: string, now: Date, ids: string[]) {
  // Read first: the Notes' Tag links go with them, and a Tag only they carried too.
  const tags = await tagParts(tx, accountId, { noteIds: ids });
  const deleted = await tx
    .delete(note)
    .where(myNotes(accountId, ids))
    .returning({ row: storedRow(note) });
  if (!deleted.length) return { count: 0, undoToken: null };
  const undoToken = await recordUndo(tx, accountId, now, {
    reinsert: { note: deleted.map(({ row }) => row), ...tags },
  });
  return { count: deleted.length, undoToken };
}

/**
 * Moves the Notes still there and not in `sourceId` already to that Source
 * (which the caller has checked). Each keeps its capture time and Locator
 * order; it enters the Source now, so Organizing pass counts it "yeni"
 * there (#36). One token takes them all back.
 */
export async function moveNotes(tx: LibraryTx, accountId: string, now: Date, ids: string[], sourceId: string) {
  const where = and(myNotes(accountId, ids), ne(note.sourceId, sourceId));
  const before = await tx
    .select({ row: storedRow(note, [note.sourceId, note.enteredSourceAt]) })
    .from(note)
    .where(where)
    .for('update');
  if (!before.length) return { count: 0, undoToken: null };
  await tx.update(note).set({ sourceId, enteredSourceAt: now, updatedAt: now }).where(where);
  const undoToken = await recordUndo(tx, accountId, now, { revert: { note: before.map(({ row }) => row) } });
  return { count: before.length, undoToken };
}

/** What the merge preview corrected; left out, it stays as the merge made it. */
export type MergeEdits = NoteText;

/**
 * Note merge (#13): the Notes, two or more of one Source, become their first
 * in Locator order, holding the joined texts and every Tag (core's
 * mergeNotes, as the preview shows it), with the preview's corrections on
 * top. The others go. One token brings back the first as it was and the
 * others with their Tags. Refused (NOT_FOUND) when a Note is not there any
 * more, and (BAD_REQUEST) across Sources or with no text left.
 */
export async function mergeSelected(tx: LibraryTx, accountId: string, now: Date, ids: string[], edits: MergeEdits) {
  const notes = await tx
    .select({
      id: note.id,
      sourceId: note.sourceId,
      locator: note.locator,
      locatorSort: note.locatorSort,
      excerpt: note.excerpt,
      comment: note.comment,
    })
    .from(note)
    .where(myNotes(accountId, ids))
    .for('update');
  if (notes.length < ids.length) throw new TRPCError({ code: 'NOT_FOUND' });
  if (new Set(notes.map((n) => n.sourceId)).size > 1)
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'A Note merge takes Notes of one Source' });
  const tags = await tagsOfNotes(tx, accountId, ids);
  const merged = mergeNotes(notes.map((n) => ({ ...n, tags: (tags.get(n.id) ?? []).map((tag) => tag.name) })));
  // The preview's corrections are an edit of the merged Note, with no sort value of its own: a
  // corrected one stays with the Locator it was corrected for.
  const edited = editedNote(merged, edits);
  if (!edited) throw new TRPCError({ code: 'BAD_REQUEST', message: 'An Excerpt or a Comment is needed' });
  const others = ids.filter((id) => id !== merged.id);

  const [before] = await tx
    .select({ row: storedRow(note, [note.locator, note.locatorSort, note.excerpt, note.comment, note.updatedAt]) })
    .from(note)
    .where(myNotes(accountId, [merged.id]));
  // The others' Tags go on the first before the others go, so none is left unused on the way.
  const tagIds = [...new Set(others.flatMap((id) => (tags.get(id) ?? []).map((tag) => tag.id)))];
  const added = tagIds.length
    ? await tx
        .insert(noteTag)
        .values(tagIds.map((tagId) => ({ noteId: merged.id, tagId, accountId })))
        .onConflictDoNothing()
        .returning({ noteId: noteTag.noteId, tagId: noteTag.tagId })
    : [];
  const otherTags = await tagParts(tx, accountId, { noteIds: others });
  const deleted = await tx
    .delete(note)
    .where(myNotes(accountId, others))
    .returning({ row: storedRow(note) });
  await tx
    .update(note)
    .set({ ...edited, updatedAt: now })
    .where(myNotes(accountId, [merged.id]));
  const undoToken = await recordUndo(tx, accountId, now, {
    remove: { [getTableName(noteTag)]: added.map(({ noteId, tagId }) => ({ note_id: noteId, tag_id: tagId })) },
    reinsert: { note: deleted.map(({ row }) => row), ...otherTags },
    revert: { note: [before!.row] },
  });
  return { id: merged.id, undoToken };
}
