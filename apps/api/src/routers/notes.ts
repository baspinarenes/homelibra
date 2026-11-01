import { SOURCE_NOT_FOUND } from '@homelibra/core/errors';
import { capturedNote, compareNotes, editedNote } from '@homelibra/core/note';
import { TRPCError } from '@trpc/server';
import { and, eq, isNull, ne, or } from 'drizzle-orm';
import { z } from 'zod';

import type { LibraryTx } from '../db/client';
import { note, noteTag, source } from '../db/schema';
import { mySource } from '../sources/sources';
import { addNoteTags, resolveTags, setTags, tagNames, tagsOfNotes } from '../tags/tags';
import { libraryProcedure, router } from '../trpc/init';
import { deleteWithUndo } from '../undo/delete';
import { recordUndo, storedRow } from '../undo/undo';

// A Note's text as typed: core's capturedNote and editedNote keep it as stored.
const noteText = z.string().nullish();
const requiredText = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1));

const noteColumns = {
  id: note.id,
  locator: note.locator,
  locatorSort: note.locatorSort,
  excerpt: note.excerpt,
  comment: note.comment,
};

/** What capturedNote and editedNote mean by null: the Note would be left without text. */
const needsText = () => new TRPCError({ code: 'BAD_REQUEST', message: 'An Excerpt or a Comment is needed' });

/** Fails with NOT_FOUND ({@link SOURCE_NOT_FOUND}) unless the Source is in this Library. */
async function assertSource(tx: LibraryTx, accountId: string, sourceId: string) {
  const [row] = await tx.select({ id: source.id }).from(source).where(mySource(accountId, sourceId));
  if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: SOURCE_NOT_FOUND });
}

/** The Note with this id, when it is in this Library. */
const myNote = (accountId: string, id: string) => and(eq(note.id, id), eq(note.accountId, accountId));

export const notesRouter = router({
  /**
   * Captures a Note. The device makes its id, so a repeated call with the
   * same id (a retry, the outbox sending again) changes nothing (ADR-0008).
   * Only an Excerpt or a Comment is needed; Locator and Tags are not.
   */
  create: libraryProcedure
    .input(
      z.object({
        id: z.uuidv7(),
        sourceId: z.uuid(),
        locator: noteText,
        excerpt: noteText,
        comment: noteText,
        /** Tag names from the "+ etiket" picker; untagged is the default. */
        tags: tagNames.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, sourceId, tags } = input;
      const fields = capturedNote(input);
      if (!fields) throw needsText();
      await assertSource(ctx.tx, ctx.accountId, sourceId);
      const [created] = await ctx.tx
        .insert(note)
        .values({
          id,
          sourceId,
          ...fields,
          enteredSourceAt: ctx.now(),
          accountId: ctx.accountId,
        })
        .onConflictDoNothing({ target: note.id })
        .returning({ id: note.id });
      // Sent again, the Note keeps the Tags it has now, which may have changed since.
      if (created && tags?.length)
        await setTags(ctx.tx, ctx.accountId, noteTag, id, await resolveTags(ctx.tx, ctx.accountId, tags));
      return { id };
    }),

  /**
   * Adds the Comment written right after an Excerpt to that Excerpt's Note.
   * Sending the same Comment again changes nothing; a different Comment
   * already on the Note is never written over (CONFLICT).
   */
  attachComment: libraryProcedure
    .input(
      z.object({
        id: z.uuidv7(),
        comment: requiredText,
        /** Tags chosen in the box for the Comment: they join the Note's own. */
        tags: tagNames.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [attached] = await ctx.tx
        .update(note)
        .set({ comment: input.comment, updatedAt: new Date() })
        .where(and(myNote(ctx.accountId, input.id), or(isNull(note.comment), eq(note.comment, input.comment))))
        .returning({ id: note.id });
      if (attached) {
        if (input.tags?.length)
          await addNoteTags(ctx.tx, ctx.accountId, input.id, await resolveTags(ctx.tx, ctx.accountId, input.tags));
        return;
      }
      const [existing] = await ctx.tx.select({ id: note.id }).from(note).where(myNote(ctx.accountId, input.id));
      throw new TRPCError({ code: existing ? 'CONFLICT' : 'NOT_FOUND' });
    }),

  /**
   * Geri al after attachComment: the Comment leaves the Note for a Note of
   * its own at the same Source and Locator, with the id the device made.
   * The text is kept, never dropped.
   */
  detachComment: libraryProcedure
    .input(z.object({ id: z.uuidv7(), commentNoteId: z.uuidv7() }))
    .mutation(async ({ ctx, input }) => {
      // Sent again: the Comment's Note is already there.
      const [alreadyDetached] = await ctx.tx
        .select({ id: note.id })
        .from(note)
        .where(myNote(ctx.accountId, input.commentNoteId));
      if (alreadyDetached) return;
      const [excerptNote] = await ctx.tx
        .select({
          sourceId: note.sourceId,
          locator: note.locator,
          locatorSort: note.locatorSort,
          excerpt: note.excerpt,
          comment: note.comment,
        })
        .from(note)
        .where(myNote(ctx.accountId, input.id));
      if (!excerptNote) throw new TRPCError({ code: 'NOT_FOUND' });
      // Without both there is no Comment to move, or the Note would be left empty.
      if (!excerptNote.excerpt || !excerptNote.comment) throw new TRPCError({ code: 'BAD_REQUEST' });
      await ctx.tx.update(note).set({ comment: null, updatedAt: new Date() }).where(myNote(ctx.accountId, input.id));
      await ctx.tx.insert(note).values({
        id: input.commentNoteId,
        accountId: ctx.accountId,
        sourceId: excerptNote.sourceId,
        locator: excerptNote.locator,
        // The Excerpt's, so the two Notes stay side by side in Locator order.
        locatorSort: excerptNote.locatorSort,
        comment: excerptNote.comment,
      });
    }),

  /**
   * A Source's Notes, listed in one place: the Source page, in Locator order
   * (core's compareNotes), with the writing box under them (#87).
   */
  list: libraryProcedure.input(z.object({ sourceId: z.uuid() })).query(async ({ ctx, input }) => {
    await assertSource(ctx.tx, ctx.accountId, input.sourceId);
    const rows = await ctx.tx
      .select(noteColumns)
      .from(note)
      .where(and(eq(note.sourceId, input.sourceId), eq(note.accountId, ctx.accountId)));
    const tags = await tagsOfNotes(
      ctx.tx,
      ctx.accountId,
      rows.map((row) => row.id),
    );
    // Only each Note's own Tags; the Source's stay on the Source (ADR-0003).
    return rows.sort(compareNotes).map((row) => ({ ...row, tags: tags.get(row.id) ?? [] }));
  }),

  get: libraryProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const [row] = await ctx.tx
      .select({ ...noteColumns, sourceId: note.sourceId })
      .from(note)
      .where(and(eq(note.id, input.id), eq(note.accountId, ctx.accountId)));
    if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
    const tags = await tagsOfNotes(ctx.tx, ctx.accountId, [row.id]);
    return { ...row, tags: tags.get(row.id) ?? [] };
  }),

  /**
   * Changes only what the call names; blank means empty. The sort value is
   * never given: core's editedNote reads it from the Locator on every edit
   * (#125). An edit that reaches a Note already deleted is ignored: the
   * outbox sends a device's edits in order and must not stall on one (#36).
   */
  update: libraryProcedure
    .input(
      z.object({
        id: z.uuid(),
        locator: noteText,
        excerpt: noteText,
        comment: noteText,
        /** All the Note's Tags, by name: what the picker leaves on it. */
        tags: tagNames.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tags, ...edit } = input;
      const where = and(eq(note.id, id), eq(note.accountId, ctx.accountId));
      const [current] = await ctx.tx.select(noteColumns).from(note).where(where);
      if (!current) return { id };
      const edited = editedNote(current, edit);
      if (!edited) throw needsText();
      await ctx.tx
        .update(note)
        .set({ ...edited, updatedAt: new Date() })
        .where(where);
      if (tags) await setTags(ctx.tx, ctx.accountId, noteTag, id, await resolveTags(ctx.tx, ctx.accountId, tags));
      return { id };
    }),

  /**
   * Notu sil: the Note goes from everywhere at once, with no confirmation;
   * the token takes it back (Geri al). Deleting a Note that is already gone
   * changes nothing and offers no Geri al.
   */
  delete: libraryProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { undoToken } = await deleteWithUndo(ctx.tx, ctx.accountId, ctx.now(), { notes: [input.id] });
    return { undoToken };
  }),

  /**
   * The Kaynak field of note editing: the Note goes to another Source with
   * its Locator, Excerpt and Comment as they are. Its capture time (its id)
   * and Locator order stay; when it entered its Source is now (#36). The
   * token takes it back (Geri al). A move that reaches a Note already
   * deleted, or one in that Source already, is ignored.
   */
  move: libraryProcedure.input(z.object({ id: z.uuid(), sourceId: z.uuid() })).mutation(async ({ ctx, input }) => {
    await assertSource(ctx.tx, ctx.accountId, input.sourceId);
    const where = and(myNote(ctx.accountId, input.id), ne(note.sourceId, input.sourceId));
    const [before] = await ctx.tx
      .select({ row: storedRow(note, [note.sourceId, note.enteredSourceAt]) })
      .from(note)
      .where(where)
      .for('update');
    if (!before) return { undoToken: null };
    const now = ctx.now();
    await ctx.tx.update(note).set({ sourceId: input.sourceId, enteredSourceAt: now, updatedAt: now }).where(where);
    const undoToken = await recordUndo(ctx.tx, ctx.accountId, now, { revert: { note: [before.row] } });
    return { undoToken };
  }),
});
