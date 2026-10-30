/** A run of an Excerpt or a Comment: a word that matched the query, or anything else. */
export type Segment = { text: string; hit: boolean };

/** How much text a result shows before its first match, and in all. */
const BEFORE = 60;
const LENGTH = 240;

/**
 * The part of a text a search result shows: from a little before the first
 * match, cut at word gaps and marked with … where text was left out.
 * Neighbouring runs that are not matches are joined.
 */
export function snippet(marks: Segment[]): Segment[] {
  const first = Math.max(
    0,
    marks.findIndex((s) => s.hit),
  );
  let start = first;
  let before = 0;
  while (start > 0 && before + (marks[start - 1]?.text.length ?? 0) <= BEFORE) {
    start -= 1;
    before += marks[start]?.text.length ?? 0;
  }
  let end = first;
  let length = before;
  while (end < marks.length && (end === first || length + (marks[end]?.text.length ?? 0) <= LENGTH)) {
    length += marks[end]?.text.length ?? 0;
    end += 1;
  }
  const kept = marks.slice(start, end);
  // Start and end on a word, not on the gap next to it.
  if (start > 0 && kept[0] && !/[\p{L}\p{N}]/u.test(kept[0].text)) kept.shift();
  const last = kept.at(-1);
  if (end < marks.length && last && !/[\p{L}\p{N}]/u.test(last.text)) kept.pop();

  const out = joined(kept);
  if (start > 0) prepend(out, '…');
  if (end < marks.length) append(out, '…');
  return out;
}

/** A whole text's runs, neighbouring runs that are not matches joined into one. */
export function joined(marks: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const segment of marks) {
    const previous = out.at(-1);
    if (previous && !previous.hit && !segment.hit) previous.text += segment.text;
    else out.push({ ...segment });
  }
  return out;
}

function prepend(out: Segment[], text: string) {
  const head = out[0];
  if (head && !head.hit) head.text = text + head.text;
  else out.unshift({ text, hit: false });
}

function append(out: Segment[], text: string) {
  const tail = out.at(-1);
  if (tail && !tail.hit) tail.text += text;
  else out.push({ text, hit: false });
}
