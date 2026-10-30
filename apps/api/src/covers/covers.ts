import { and, eq, or, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

import { type Db, withLibrary } from '../db/client';
import { source } from '../db/schema';
import type { ObjectStorage } from '../storage/object-storage';

/** The two files of one Cover, by their keys in the covers bucket. */
export type Cover = { large: string; small: string };

export type CoverSize = keyof Cover;

/** The most each file may weigh (#40, ADR-0011); the app makes them far smaller. */
export const COVER_MAX_BYTES: Record<CoverSize, number> = { large: 400 * 1024, small: 40 * 1024 };

/** The Source columns a Cover is read from, to select alongside the rest. */
export const coverColumns = { coverKeyLarge: source.coverKeyLarge, coverKeySmall: source.coverKeySmall };

/** A Source row's Cover, or null when it shows its type's template. */
export function coverOf<T extends { coverKeyLarge: string | null; coverKeySmall: string | null }>(row: T) {
  const { coverKeyLarge, coverKeySmall, ...rest } = row;
  const cover: Cover | null = coverKeyLarge && coverKeySmall ? { large: coverKeyLarge, small: coverKeySmall } : null;
  return { ...rest, cover };
}

/** Whether the bytes start as a JPEG does (the start-of-image marker). */
export function isJpeg(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/**
 * Writes one picture's files under the Account's prefix with fresh keys, so
 * a replaced Cover never shares a key (and a browser cache entry) with the
 * one before it.
 */
export async function storeCover(storage: ObjectStorage, accountId: string, files: Record<CoverSize, Uint8Array>) {
  const id = uuidv7();
  const cover: Cover = { large: `${accountId}/${id}-large.jpg`, small: `${accountId}/${id}-small.jpg` };
  await Promise.all([
    storage.put(cover.large, files.large, 'image/jpeg'),
    storage.put(cover.small, files.small, 'image/jpeg'),
  ]);
  return cover;
}

/**
 * A Cover's file for the Account that has it on one of its Sources, or null.
 * A file the bucket no longer has is forgotten: its Source falls back to the
 * template without a warning (ADR-0011).
 */
export async function readCover(db: Db, storage: ObjectStorage, accountId: string, key: string) {
  const mine = and(eq(source.accountId, accountId), or(eq(source.coverKeyLarge, key), eq(source.coverKeySmall, key)));
  const inUse = await withLibrary(db, accountId, (tx) => tx.select({ id: source.id }).from(source).where(mine));
  if (!inUse.length) return null;
  const bytes = await storage.get(key);
  if (bytes) return bytes;
  await withLibrary(db, accountId, (tx) =>
    tx.update(source).set({ coverKeyLarge: null, coverKeySmall: null }).where(mine),
  );
  return null;
}

/** How long a file no Source points at is kept: enough for every Geri al that might want it back. */
const UNUSED_KEEP_MS = 24 * 60 * 60 * 1000;

/** The bucket's prefix for Open Library's covers, shared by every Library (#65); never cleaned up here. */
const SHARED_PREFIX = 'isbn/';

/** Keys asked about at a time. */
const BATCH = 500;

/**
 * The daily clean-up (ADR-0011): deletes every file older than a day that no
 * Source points at, in any Library, and that no Geri al still in its time
 * would bring back. Leaves `isbn/` alone. A deleted Account's files go on the
 * first run after its rows. Returns how many files went.
 */
export async function deleteUnusedCovers(db: Db, storage: ObjectStorage, now: Date) {
  const cutoff = now.getTime() - UNUSED_KEEP_MS;
  let deleted = 0;
  let batch: string[] = [];
  const sweep = async () => {
    const inUse = await db.execute<{ key: string }>(
      sql`select k as key from hl_cover_keys_in_use(${sql`array[${sql.join(
        batch.map((key) => sql`${key}`),
        sql`, `,
      )}]::text[]`}, ${now.toISOString()}::timestamptz) k`,
    );
    const kept = new Set(inUse.map((row) => row.key));
    const unused = batch.filter((key) => !kept.has(key));
    if (unused.length) await storage.delete(unused);
    deleted += unused.length;
    batch = [];
  };
  for await (const { key, storedAt } of storage.list()) {
    if (key.startsWith(SHARED_PREFIX) || storedAt.getTime() > cutoff) continue;
    batch.push(key);
    if (batch.length >= BATCH) await sweep();
  }
  if (batch.length) await sweep();
  return deleted;
}
