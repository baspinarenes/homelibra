import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { COVER_MAX_BYTES, type CoverSize, isJpeg, storeCover } from '../covers/covers';
import type { LibraryTx } from '../db/client';
import { source } from '../db/schema';
import type { ObjectStorage } from '../storage/object-storage';
import { libraryProcedure, router } from '../trpc/init';
import { isbn } from './lookups';
import { recordUndo, storedRow } from '../undo/undo';

/** A file the app sent is not a JPEG. */
export const COVER_NOT_JPEG = 'COVER_NOT_JPEG';

/** A file the app sent weighs more than its size allows. */
export const COVER_TOO_LARGE = 'COVER_TOO_LARGE';

/** Base64 of a file up to twice its size's limit; the exact limit is checked on the bytes. */
const file = (size: CoverSize) => z.base64().max(Math.ceil((COVER_MAX_BYTES[size] * 2) / 3) * 4);

function decode(size: CoverSize, text: string) {
  const bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  if (!isJpeg(bytes)) throw new TRPCError({ code: 'BAD_REQUEST', message: COVER_NOT_JPEG });
  if (bytes.length > COVER_MAX_BYTES[size]) throw new TRPCError({ code: 'BAD_REQUEST', message: COVER_TOO_LARGE });
  return bytes;
}

/** Open Library has no cover for the ISBN, or no longer has its files. */
export const OPEN_LIBRARY_COVER_NOT_FOUND = 'OPEN_LIBRARY_COVER_NOT_FOUND';

/**
 * Gives the Source these files as its Cover, in place of any it had.
 * Replacing one offers Geri al, which brings the earlier Cover back; adding
 * the first does not.
 */
async function giveCover(
  ctx: { tx: LibraryTx; accountId: string; covers: ObjectStorage; now: () => Date },
  sourceId: string,
  files: Record<CoverSize, Uint8Array>,
) {
  const mine = and(eq(source.id, sourceId), eq(source.accountId, ctx.accountId));
  const [before] = await ctx.tx
    .select({ row: storedRow(source, [source.coverKeyLarge, source.coverKeySmall]), large: source.coverKeyLarge })
    .from(source)
    .where(mine)
    .for('update');
  if (!before) throw new TRPCError({ code: 'NOT_FOUND' });
  const cover = await storeCover(ctx.covers, ctx.accountId, files);
  await ctx.tx.update(source).set({ coverKeyLarge: cover.large, coverKeySmall: cover.small }).where(mine);
  const undoToken = before.large
    ? await recordUndo(ctx.tx, ctx.accountId, ctx.now(), { revert: { source: [before.row] } })
    : null;
  return { cover, undoToken };
}

/**
 * A Source's Cover (#40, "Cover"; ADR-0011). The app makes both files from
 * the picture the scholar chose (long edge 1000 px and 240 px); the API
 * checks them and keeps them in the covers bucket. Online only: the outbox
 * never carries a Cover. The files are shown through `GET /api/covers/<key>`.
 */
export const coversRouter = router({
  /**
   * Gives the Source this picture as its Cover, in place of any it had.
   * Replacing one offers Geri al, which brings the earlier Cover back;
   * adding the first does not.
   */
  set: libraryProcedure
    .input(z.object({ sourceId: z.uuid(), large: file('large'), small: file('small') }))
    .mutation(({ ctx, input }) =>
      giveCover(ctx, input.sourceId, { large: decode('large', input.large), small: decode('small', input.small) }),
    ),

  /**
   * Accepts the cover ISBN ile öner offered: a copy of Open Library's files
   * becomes the Source's Cover under the Account's prefix, after which it is
   * an ordinary Cover. Not found when there is no such cover (any more).
   */
  setFromOpenLibrary: libraryProcedure
    .input(z.object({ sourceId: z.uuid(), isbn }))
    .mutation(async ({ ctx, input }) => {
      const files = await ctx.lookups.isbnCoverFiles(input.isbn);
      if (!files) throw new TRPCError({ code: 'NOT_FOUND', message: OPEN_LIBRARY_COVER_NOT_FOUND });
      return giveCover(ctx, input.sourceId, files);
    }),

  /** Kapağı kaldır: no question asked, Geri al brings it back. A Source without a Cover offers none. */
  remove: libraryProcedure.input(z.object({ sourceId: z.uuid() })).mutation(async ({ ctx, input }) => {
    const mine = and(eq(source.id, input.sourceId), eq(source.accountId, ctx.accountId));
    const [before] = await ctx.tx
      .select({ row: storedRow(source, [source.coverKeyLarge, source.coverKeySmall]), large: source.coverKeyLarge })
      .from(source)
      .where(mine)
      .for('update');
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' });
    if (!before.large) return { undoToken: null };
    await ctx.tx.update(source).set({ coverKeyLarge: null, coverKeySmall: null }).where(mine);
    const undoToken = await recordUndo(ctx.tx, ctx.accountId, ctx.now(), { revert: { source: [before.row] } });
    return { undoToken };
  }),
});
