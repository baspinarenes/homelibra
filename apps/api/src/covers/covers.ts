import { and, eq, or, sql } from 'drizzle-orm';
import sharp from 'sharp';
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

/** The bucket's prefix for Open Library's covers, shared by every Library (#65); never cleaned up here. */
const SHARED_PREFIX = 'isbn/';

/** Whether the bytes start as a JPEG does (the start-of-image marker). */
export function isJpeg(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

/** Long edges of the two files (ADR-0011), as the app makes them; a smaller picture is not enlarged. */
const LONG_EDGE: Record<CoverSize, number> = { large: 1000, small: 240 };

/** JPEG quality, then lower ones for the rare picture that would still be too heavy. */
const QUALITIES = [70, 50, 30];

/**
 * The two files of a Cover made on the server, from a picture in any format
 * sharp reads: what the app makes on the device for a picture the scholar
 * chose, uncropped. Throws when the bytes are not a picture.
 */
export async function coverFilesFrom(picture: Uint8Array): Promise<Record<CoverSize, Uint8Array>> {
  const file = async (size: CoverSize) => {
    const resized = sharp(picture)
      .rotate()
      .resize({ width: LONG_EDGE[size], height: LONG_EDGE[size], fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' });
    for (const quality of QUALITIES) {
      const bytes = await resized.clone().jpeg({ quality, mozjpeg: true }).toBuffer();
      if (bytes.length <= COVER_MAX_BYTES[size]) return new Uint8Array(bytes);
    }
    throw new Error(`the ${size} cover file stays over ${COVER_MAX_BYTES[size]} bytes`);
  };
  const [large, small] = await Promise.all([file('large'), file('small')]);
  return { large, small };
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
 * template without a warning (ADR-0011). Open Library's covers under `isbn/`
 * belong to no Library and are shown to every scholar: ISBN ile öner offers them.
 */
export async function readCover(db: Db, storage: ObjectStorage, accountId: string, key: string) {
  if (key.startsWith(SHARED_PREFIX)) return storage.get(key);
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

/** Where Open Library's cover of an ISBN-13 is kept, resized, for every Library. */
export function sharedCoverKeys(isbn: string): Cover {
  return { large: `${SHARED_PREFIX}${isbn}.jpg`, small: `${SHARED_PREFIX}${isbn}-small.jpg` };
}

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
