import { rederivedSort } from '@homelibra/core/note';
import { eq } from 'drizzle-orm';

import type { LibraryTx } from '../db/client';
import { note } from '../db/schema';

/**
 * Every Note's sort value read from its Locator again, by core's rule: the
 * work migration 0020 queues once sort values corrected by hand are gone
 * (#125). Runs as the table owner, across Libraries. A Note whose value is
 * right already is left as it is, and no Note's updatedAt moves: no scholar
 * edited it.
 */
export async function rederiveSortValues(tx: LibraryTx) {
  const notes = await tx.select({ id: note.id, locator: note.locator, locatorSort: note.locatorSort }).from(note);
  for (const stored of notes) {
    const rederived = rederivedSort(stored);
    if (rederived) await tx.update(note).set(rederived).where(eq(note.id, stored.id));
  }
}
