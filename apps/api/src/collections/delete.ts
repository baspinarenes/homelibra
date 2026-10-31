import { and, eq } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { collection } from '../db/schema';
import { tagParts } from '../tags/snapshot';
import { recordUndo, storedRow } from '../undo/undo';

/**
 * Dosyayı sil (#36): the Collection goes at once, Notes and Tags stay; a Tag
 * only this Collection kept goes with it (0016_collections). Returns the Geri
 * al token, whose snapshot holds the Collection, its Tag references and every
 * Tag they point at, read before the delete (the references cascade).
 * Nothing to delete (gone already, or never this Library's) gives `null`.
 */
export async function deleteCollection(tx: LibraryTx, accountId: string, id: string, now: Date) {
  const mine = and(eq(collection.id, id), eq(collection.accountId, accountId));
  const [found] = await tx
    .select({ row: storedRow(collection) })
    .from(collection)
    .where(mine)
    .for('update');
  if (!found) return null;
  const tags = await tagParts(tx, accountId, { collectionIds: [id] });
  await tx.delete(collection).where(mine);
  return recordUndo(tx, accountId, now, {
    reinsert: { collection: [found.row], ...tags },
  });
}
