import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

import type { ObjectStorage } from './object-storage';

/**
 * A bucket stand-in for development without the Operator's keys: each file
 * under its key in a local directory, written when the file was. Never used
 * in production (src/env.ts).
 */
export function localDirectoryStorage(directory: string): ObjectStorage {
  const root = resolve(directory);
  const pathOf = (key: string) => {
    const path = resolve(root, key);
    if (!path.startsWith(root + sep)) throw new Error(`key outside the directory: ${key}`);
    return path;
  };

  async function* walk(dir: string): AsyncGenerator<string> {
    const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(path);
      else yield path;
    }
  }

  return {
    async put(key, bytes) {
      const path = pathOf(key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    },

    async get(key) {
      try {
        return new Uint8Array(await readFile(pathOf(key)));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },

    async *list() {
      for await (const path of walk(root)) {
        yield { key: relative(root, path).split(sep).join('/'), storedAt: (await stat(path)).mtime };
      }
    },

    async delete(keys) {
      await Promise.all(keys.map((key) => rm(pathOf(key), { force: true })));
    },
  };
}
