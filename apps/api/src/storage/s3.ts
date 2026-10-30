import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import type { ObjectStorage } from './object-storage';

export type S3Options = {
  /** The S3-compatible endpoint, e.g. Hetzner's `https://fsn1.your-objectstorage.com`. */
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

/** S3 deletes at most this many keys in one request. */
const DELETE_BATCH = 1000;

/**
 * A private S3-compatible bucket (Hetzner Object Storage, ADR-0011). Only
 * the API reaches it, with the Operator's keys; it has no public access,
 * signed URLs or CORS.
 */
export function s3Storage({ endpoint, region, bucket, accessKeyId, secretAccessKey }: S3Options): ObjectStorage {
  const client = new S3Client({ endpoint, region, credentials: { accessKeyId, secretAccessKey } });
  return {
    async put(key, bytes, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentType }));
    },

    async get(key) {
      try {
        const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        return object.Body ? new Uint8Array(await object.Body.transformToByteArray()) : null;
      } catch (error) {
        if (error instanceof NoSuchKey) return null;
        throw error;
      }
    },

    async *list() {
      let token: string | undefined;
      do {
        const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
        for (const object of page.Contents ?? []) {
          if (object.Key && object.LastModified) yield { key: object.Key, storedAt: object.LastModified };
        }
        token = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (token);
    },

    async delete(keys) {
      for (let i = 0; i < keys.length; i += DELETE_BATCH) {
        const objects = keys.slice(i, i + DELETE_BATCH).map((Key) => ({ Key }));
        const result = await client.send(
          new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }),
        );
        if (result.Errors?.length) throw new Error(`S3 delete failed for ${result.Errors.length} keys`);
      }
    },
  };
}
