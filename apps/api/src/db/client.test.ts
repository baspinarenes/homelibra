import { describe, expect, it } from 'vitest';

import { assertDatabaseReachable, createDb } from './client';

describe('assertDatabaseReachable', () => {
  // Without it the API listened with no Postgres behind it, and the first
  // sign-in failed with a DrizzleQueryError whose ECONNREFUSED sat at the end.
  it('says where Postgres was looked for and how to start it', async () => {
    const url = 'postgres://nobody:secret@127.0.0.1:1/homelibra';
    const db = createDb(url);
    try {
      const error = await assertDatabaseReachable(db, url).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('127.0.0.1:1');
      expect((error as Error).message).toContain('ECONNREFUSED');
      expect((error as Error).message).toContain('pnpm db:up');
      expect((error as Error).message).not.toContain('secret');
    } finally {
      await db.close();
    }
  });
});
