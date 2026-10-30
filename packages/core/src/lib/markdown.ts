import { type CalendarDate, formatDate } from './calendar-date';

/** What the copy shows of a Source: its Yazar, Başlık and Tarih, nothing else (no İlk baskı tarihi, no Tags). */
export type MarkdownSource = { author: string | null; title: string; date: CalendarDate | null };

/** What the copy shows of a Note: its Locator, Excerpt and Comment (no Tags). */
export type MarkdownNote = { locator: string | null; excerpt: string | null; comment: string | null };

/** A Collection's view as the screen shows it: Source groups and their Notes, already in reading order. */
export type MarkdownCollection = { name: string; groups: { source: MarkdownSource; notes: MarkdownNote[] }[] };

const filled = (text: string | null | undefined) => text?.trim() || null;

/** `> ` before every line, and a bare `>` between paragraphs, so each paragraph stays in the quote. */
function quote(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => `> ${line.trim()}`)
        .join('\n'),
    )
    .join('\n>\n');
}

function noteBlocks({ locator, excerpt, comment }: MarkdownNote) {
  return [
    filled(locator) && `**${filled(locator)}**`,
    filled(excerpt) && quote(filled(excerpt)!),
    filled(comment),
  ].filter((block): block is string => !!block);
}

function sourceBlocks({ author, title, date }: MarkdownSource, notes: MarkdownNote[]) {
  const names = [filled(author), filled(title)].filter(Boolean).join(', ');
  const heading = `## ${names}${date ? ` (${formatDate(date)})` : ''}`;
  return [heading, ...notes.flatMap(noteBlocks)];
}

const document = (blocks: string[]) => `${blocks.join('\n\n')}\n`;

/**
 * One Source and its Notes as the copy writes them (#12): `## Yazar,
 * Başlık (Tarih)`, then for each Note `**Locator**`, `> Excerpt` and its
 * Comment as a plain paragraph. A blank Yazar, Tarih or Locator is left
 * out; Tarih is written as entered (`formatDate`). The Notes stay in the
 * order given, which is the screen's.
 */
export function sourceToMarkdown(source: MarkdownSource, notes: MarkdownNote[]): string {
  return document(sourceBlocks(source, notes));
}

/** "Markdown olarak kopyala": `# Dosya adı`, then every Source group of the view in the screen's order. */
export function collectionToMarkdown({ name, groups }: MarkdownCollection): string {
  return document([`# ${name.trim()}`, ...groups.flatMap((group) => sourceBlocks(group.source, group.notes))]);
}
