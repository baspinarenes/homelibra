/** A file in a bucket and when it was written there. */
export type StoredObject = { key: string; storedAt: Date };

/**
 * The edge where files leave the system: an S3-compatible bucket such as the
 * private covers bucket (ADR-0011). Tests swap in a fake; development
 * without a bucket keeps the files in a local directory.
 */
export interface ObjectStorage {
  /** Writes the file under `key`, replacing whatever was there. */
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  /** The file under `key`, or null when there is none. */
  get(key: string): Promise<Uint8Array<ArrayBuffer> | null>;
  /** Every file in the bucket, with when it was written. */
  list(): AsyncIterable<StoredObject>;
  /** Deletes the files; a key with no file is not an error. */
  delete(keys: string[]): Promise<void>;
}
