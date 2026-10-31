import { compareTr } from '@homelibra/core';
import { sourceToMarkdown } from '@homelibra/core/markdown';
import { capturedAt, compareNotes } from '@homelibra/core/note';
import { keptHidden } from '@homelibra/core/source';
import { eq } from 'drizzle-orm';
import { strToU8, type Zippable, zipSync } from 'fflate';

import { type Db, withLibrary } from '../db/client';
import { collection, collectionTag, note, noteTag, source, sourceTag, tag } from '../db/schema';
import type { ObjectStorage } from '../storage/object-storage';
import { LIBRARY_EXPORT_VERSION, type LibraryExport, libraryExportJsonSchema } from './schema';
import { readme } from './readme';

/** Where things go in the ZIP. Turkish, like everything else the scholar reads in it. */
export const EXPORT_PATHS = {
  library: 'kutuphane.json',
  schema: 'kutuphane.schema.json',
  readme: 'BENIOKU.md',
  markdown: 'kaynaklar/',
  covers: 'kapaklar/',
};

/** Everything in one Library, read in one transaction so the copy is consistent. */
function readLibrary(db: Db, accountId: string) {
  return withLibrary(db, accountId, async (tx) => ({
    sources: await tx.select().from(source).where(eq(source.accountId, accountId)),
    notes: await tx.select().from(note).where(eq(note.accountId, accountId)),
    tags: await tx.select({ id: tag.id, name: tag.name }).from(tag).where(eq(tag.accountId, accountId)),
    noteTags: await tx.select().from(noteTag).where(eq(noteTag.accountId, accountId)),
    sourceTags: await tx.select().from(sourceTag).where(eq(sourceTag.accountId, accountId)),
    collections: await tx.select().from(collection).where(eq(collection.accountId, accountId)),
    collectionTags: await tx.select().from(collectionTag).where(eq(collectionTag.accountId, accountId)),
  }));
}

/** Tag names by carrier, each carrier's in name order. */
function namesBy<K extends string>(
  links: ({ tagId: string } & Record<K, string>)[],
  key: K,
  names: Map<string, string>,
) {
  const by = new Map<string, string[]>();
  for (const link of links) {
    const name = names.get(link.tagId);
    if (name === undefined) continue;
    by.set(link[key], [...(by.get(link[key]) ?? []), name]);
  }
  for (const list of by.values()) list.sort(compareTr);
  return (id: string) => by.get(id) ?? [];
}

// Characters no file system takes in a name, and the control characters.
// eslint-disable-next-line no-control-regex
const unsafe = /[/\\:*?"<>|\u0000-\u001f]+/g;

/**
 * A file name for each Source's Markdown, after its Başlık, unique in the
 * ZIP even where letter case is all that differs (macOS, Windows).
 */
function markdownNames() {
  const taken = new Set<string>();
  return (title: string) => {
    const base =
      title
        .replace(unsafe, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 80)
        .trim() || 'Kaynak';
    let name = base;
    for (let n = 2; taken.has(name.toLocaleLowerCase('tr')); n++) name = `${base} (${n})`;
    taken.add(name.toLocaleLowerCase('tr'));
    return `${EXPORT_PATHS.markdown}${name}.md`;
  };
}

/**
 * The Library export (#40, stories 16-18): one ZIP holding the Library as
 * JSON with its schema document, a Markdown file per Source with its Notes
 * in Locator order (the same formatter as "Markdown olarak kopyala"), and
 * each Cover's large file. A Cover whose file the bucket no longer has is
 * left out without a word (ADR-0011).
 */
export async function libraryExport(db: Db, covers: ObjectStorage, accountId: string, now: Date) {
  const rows = await readLibrary(db, accountId);
  const tagNames = new Map(rows.tags.map((row) => [row.id, row.name]));
  const tagsOfNote = namesBy(rows.noteTags, 'noteId', tagNames);
  const tagsOfSource = namesBy(rows.sourceTags, 'sourceId', tagNames);
  const tagsOfCollection = namesBy(rows.collectionTags, 'collectionId', tagNames);

  const sources = [...rows.sources].sort((a, b) => compareTr(a.title, b.title) || compareTr(a.id, b.id));
  const notesOf = new Map<string, typeof rows.notes>();
  for (const row of rows.notes) notesOf.set(row.sourceId, [...(notesOf.get(row.sourceId) ?? []), row]);
  for (const list of notesOf.values()) list.sort(compareNotes);

  const files: Zippable = {};
  const markdownName = markdownNames();
  const exported: LibraryExport = {
    format: 'homelibra-library-export',
    version: LIBRARY_EXPORT_VERSION,
    exportedAt: now.toISOString(),
    sources: [],
    notes: [],
    tags: [...rows.tags].sort((a, b) => compareTr(a.name, b.name)),
    collections: [...rows.collections]
      .sort((a, b) => compareTr(a.name, b.name))
      .map((row) => ({
        id: row.id,
        name: row.name,
        tags: tagsOfCollection(row.id),
        includeSourceNotes: row.includeSourceNotes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
  };

  for (const row of sources) {
    const notes = notesOf.get(row.id) ?? [];
    const markdown = markdownName(row.title);
    files[markdown] = strToU8(sourceToMarkdown(row, notes));

    // One file at a time: a Library's Covers together could be large.
    const bytes = row.coverKeyLarge ? await covers.get(row.coverKeyLarge) : null;
    const cover = bytes ? `${EXPORT_PATHS.covers}${row.id}.jpg` : null;
    // A JPEG does not compress further.
    if (bytes && cover) files[cover] = [bytes, { level: 0 }];

    exported.sources.push({
      id: row.id,
      type: row.type,
      title: row.title,
      author: row.author,
      isbn: row.isbn,
      doi: row.doi,
      bibliographicNote: row.bibliographicNote,
      date: row.date,
      fields: row.fields,
      hiddenFields: keptHidden(row.type, { ...row.fields, isbn: row.isbn ?? undefined, doi: row.doi ?? undefined }),
      readingStatus: row.readingStatus,
      lastFinishedAt: row.lastFinishedAt?.toISOString() ?? null,
      tags: tagsOfSource(row.id),
      cover,
      markdown,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
    for (const n of notes) {
      exported.notes.push({
        id: n.id,
        sourceId: n.sourceId,
        locator: n.locator,
        locatorSort: n.locatorSort,
        excerpt: n.excerpt,
        comment: n.comment,
        tags: tagsOfNote(n.id),
        capturedAt: capturedAt(n.id).toISOString(),
        enteredSourceAt: n.enteredSourceAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      });
    }
  }

  files[EXPORT_PATHS.library] = strToU8(JSON.stringify(exported, null, 2));
  files[EXPORT_PATHS.schema] = strToU8(JSON.stringify(libraryExportJsonSchema(), null, 2));
  files[EXPORT_PATHS.readme] = strToU8(readme(now));
  return zipSync(files, { mtime: now });
}
