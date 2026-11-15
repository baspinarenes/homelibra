import { describe, expect, it } from 'vitest';

import { resultMeta, resultRow, stepInResults } from '@/features/search/search-results';

const note = (id: string, sourceId: string, extra: { author?: string | null; fromComment?: boolean } = {}) => ({
  id,
  sourceId,
  title: 'Cemiyet-i İttihadiye Tarihçesi',
  author: 'Mehmed Ali' as string | null,
  fromComment: false,
  snippet: [
    { text: '…ilk ', hit: false },
    { text: 'nizamnamesi', hit: true },
    { text: ' Mekteb-i Tıbbiye’de…', hit: false },
  ],
  ...extra,
});

describe('resultRow', () => {
  it('gives the part a search shows as the Excerpt, its matched words marked', () => {
    const row = resultRow(note('n1', 's1'));
    expect(row.excerpt).toBe('…ilk nizamnamesi Mekteb-i Tıbbiye’de…');
    expect(row.comment).toBeNull();
    expect(row.marks.excerpt?.filter((s) => s.hit).map((s) => s.text)).toEqual(['nizamnamesi']);
  });

  it('gives it as the Comment when only the Comment matched', () => {
    const row = resultRow(note('n1', 's1', { fromComment: true }));
    expect(row.excerpt).toBeNull();
    expect(row.comment).toBe('…ilk nizamnamesi Mekteb-i Tıbbiye’de…');
    expect(row.marks.comment?.some((s) => s.hit)).toBe(true);
  });
});

describe('resultMeta', () => {
  it('names Yazar, Başlık, and "yorumdan" when the part is from the Comment', () => {
    expect(resultMeta(note('n1', 's1'), 'yorumdan')).toBe('Mehmed Ali, Cemiyet-i İttihadiye Tarihçesi');
    expect(resultMeta(note('n1', 's1', { author: null, fromComment: true }), 'yorumdan')).toBe(
      'Cemiyet-i İttihadiye Tarihçesi · yorumdan',
    );
  });
});

describe('stepInResults', () => {
  // Ranked, not grouped: s1's Notes are first and third.
  const results = [note('a', 's1'), note('b', 's2'), note('c', 's1')];

  it('moves through the results in their ranked order, across Sources, and stays on the ends', () => {
    expect(stepInResults(results, { sourceId: 's1', noteId: 'a' }, 'next')).toEqual({ sourceId: 's2', noteId: 'b' });
    expect(stepInResults(results, { sourceId: 's2', noteId: 'b' }, 'next')).toEqual({ sourceId: 's1', noteId: 'c' });
    expect(stepInResults(results, { sourceId: 's1', noteId: 'c' }, 'next')).toEqual({ sourceId: 's1', noteId: 'c' });
    expect(stepInResults(results, { sourceId: 's1', noteId: 'a' }, 'previous')).toEqual({
      sourceId: 's1',
      noteId: 'a',
    });
  });

  it('from a Note the panel walked to outside the results, goes to the next of its Source’s results by Locator', () => {
    // s1 in Locator order: a, x, c; x did not match.
    expect(stepInResults(results, { sourceId: 's1', noteId: 'x' }, 'next', ['a', 'x', 'c'])).toEqual({
      sourceId: 's1',
      noteId: 'c',
    });
  });

  it('gives nothing to step to with no Note found', () => {
    expect(stepInResults([], null, 'next')).toBeNull();
  });
});
