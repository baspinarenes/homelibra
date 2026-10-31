import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { eq, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { migrationsFolder, runMigrations } from './db/migrate';
import { note } from './db/schema';
import { testMigrationDatabaseUrl } from './test/db';
import { scholarEmail, testApi } from './test/harness';

const t = testApi();

/** Deploys #125's migration again, as onto a Library from before it: its SQL, then the runner. */
async function migrateTo0020() {
  const file = readFileSync(join(migrationsFolder, '0020_rederive_locator_sort.sql'), 'utf8');
  for (const statement of file.split('--> statement-breakpoint')) await t.owner.execute(sql.raw(statement));
  await runMigrations(testMigrationDatabaseUrl);
}

describe('The migration that drops corrected sort values (#125)', () => {
  it("derives every Note's sort value from its Locator again, by core's rule", async () => {
    const api = await (await t.signIn(scholarEmail())).call();
    const { id: sourceId } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const corrected = uuidv7();
    const folio = uuidv7();
    await api.notes.create({ id: corrected, sourceId, locator: '29 Z 1310, 1234/56', excerpt: 'İrade.' });
    await api.notes.create({ id: folio, sourceId, locator: 'vr. 12b', excerpt: 'Ferman.' });
    // As the Sıralama değeri field left them before #125.
    await t.owner
      .update(note)
      .set({ locatorSort: [1234, 56, 29, 1310] })
      .where(eq(note.id, corrected));
    await t.owner
      .update(note)
      .set({ locatorSort: [12] })
      .where(eq(note.id, folio));
    expect(await api.notes.get({ id: corrected })).toMatchObject({ locatorSort: [1234, 56, 29, 1310] });

    await migrateTo0020();

    expect(await api.notes.get({ id: corrected })).toMatchObject({ locatorSort: [29, 1310, 1234, 56] });
    expect(await api.notes.get({ id: folio })).toMatchObject({ locatorSort: [12.5] });
  });
});
