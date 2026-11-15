import { describe, expect, it } from 'vitest';

import { quickResults } from '@/features/search/quick-results';

const tag = (id: string, name: string, noteCount = 1) => ({ id, name, noteCount, sourceCount: 0 });
const source = (id: string, title: string, author: string | null = null) => ({
  id,
  title,
  author,
  date: { calendar: 'gregorian' as const, year: 2019 },
});
const note = (id: string) => ({ id, sourceId: 's1', locator: 's. 112', snippet: [{ text: id, hit: true }] });

const tagDetail = (t: { noteCount: number }) => `${t.noteCount} not`;

describe('quickResults', () => {
  it("finds Tags by their name folded as the Tag picker folds it, from Ara's words", () => {
    const tags = [tag('t1', 'Hilâfet', 3), tag('t2', 'İstanbul'), tag('t3', 'Selanik')];
    expect(quickResults({ query: 'hilafet', tags, search: undefined }, { tagDetail })).toEqual([
      { kind: 'tag', id: 't1', name: 'Hilâfet', detail: '3 not' },
    ]);
    expect(quickResults({ query: 'istan', tags, search: undefined }, { tagDetail }).map((r) => r.id)).toEqual(['t2']);
  });

  it('gives a few of each: three Tags, three Sources, four Notes', () => {
    const tags = ['a', 'b', 'c', 'd'].map((id) => tag(id, `Selanik ${id}`));
    const search = {
      sources: ['s1', 's2', 's3', 's4'].map((id) => source(id, `Selanik ${id}`)),
      notes: ['n1', 'n2', 'n3', 'n4', 'n5'].map(note),
    };
    const kinds = quickResults({ query: 'selanik', tags, search }, { tagDetail }).map((r) => `${r.kind}:${r.id}`);
    expect(kinds).toEqual([
      'tag:a',
      'tag:b',
      'tag:c',
      'source:s1',
      'source:s2',
      'source:s3',
      'note:n1',
      'note:n2',
      'note:n3',
      'note:n4',
    ]);
  });

  it('shows a Source by its Yazar and Tarih, as Ara does', () => {
    const search = { sources: [source('s1', "Selanik'te Cemiyet Mahfilleri", 'Arıkan')], notes: [] };
    expect(quickResults({ query: 'selanik', tags: [], search }, { tagDetail })).toEqual([
      { kind: 'source', id: 's1', title: "Selanik'te Cemiyet Mahfilleri", detail: 'Arıkan · 2019' },
    ]);
  });

  it('finds nothing before a word is typed', () => {
    expect(quickResults({ query: ' ', tags: [tag('t1', 'Selanik')], search: undefined }, { tagDetail })).toEqual([]);
  });
});
