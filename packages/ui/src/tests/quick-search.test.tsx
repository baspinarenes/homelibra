import { describe, expect, it } from 'vitest';

import { QuickSearch, type QuickSearchLabels, type QuickSearchResult, quickSearchKey } from '../quick-search';
import { all, byRole, classes, nameOf, type Node, render, text } from './render';

const press = (
  key: string,
  more: { metaKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {},
) => ({
  key,
  ...more,
});

// Two results and the Ara row under them.
const rows = { selected: 0, count: 3 };

describe('quickSearchKey', () => {
  it('moves the selection down and up, and stops at the first and last row', () => {
    expect(quickSearchKey(press('ArrowDown'), rows)).toEqual({ select: 1 });
    expect(quickSearchKey(press('ArrowDown'), { ...rows, selected: 2 })).toEqual({ select: 2 });
    expect(quickSearchKey(press('ArrowUp'), { ...rows, selected: 2 })).toEqual({ select: 1 });
    expect(quickSearchKey(press('ArrowUp'), rows)).toEqual({ select: 0 });
  });

  it('opens the selected row with ↵ and Ara with ⌘↵ or Ctrl+↵, wherever the selection is', () => {
    expect(quickSearchKey(press('Enter'), { ...rows, selected: 1 })).toEqual({ open: 1 });
    expect(quickSearchKey(press('Enter', { metaKey: true }), { ...rows, selected: 1 })).toBe('openAll');
    expect(quickSearchKey(press('Enter', { ctrlKey: true }), rows)).toBe('openAll');
  });

  it('closes on Esc', () => {
    expect(quickSearchKey(press('Escape'), rows)).toBe('close');
  });

  it('holds ⌘K back from the browser while the window is open, and leaves it open', () => {
    expect(quickSearchKey(press('k', { metaKey: true }), rows)).toBe('stay');
    expect(quickSearchKey(press('K', { ctrlKey: true, shiftKey: true }), rows)).toBe('stay');
  });

  it("leaves the field's own keys to the field: letters, ←→, ⌘A, ⌥ chords", () => {
    const own = [
      press('s'),
      press('ArrowLeft'),
      press('Backspace'),
      press('a', { metaKey: true }),
      press('k', { metaKey: true, altKey: true }),
      press('Enter', { altKey: true }),
    ];
    expect(own.map((key) => quickSearchKey(key, rows))).toEqual([null, null, null, null, null, null]);
  });
});

const labels: QuickSearchLabels = {
  dialog: 'Hızlı arama',
  field: 'Ara ya da git',
  placeholder: 'Etiket, kaynak ya da not ara',
  close: 'Kapat',
  go: 'Git',
  notes: 'Notlar',
  tag: 'Etiket',
  source: 'Kaynak',
  openAll: "Ara'da tüm sonuçlar: «selan»",
  select: 'seç',
  open: 'aç',
  openAllHint: "Ara'da aç",
};

const results: QuickSearchResult[] = [
  {
    kind: 'note',
    id: 'n1',
    locator: 's. 112',
    snippet: [
      { text: 'Selan', hit: true },
      { text: 'ik şubesi', hit: false },
    ],
  },
  { kind: 'source', id: 's1', title: "Selanik'te Cemiyet Mahfilleri", detail: 'Arıkan · 2019' },
  { kind: 'tag', id: 't1', name: 'Selanik', detail: '3 not' },
  { kind: 'note', id: 'n2', locator: null, snippet: [{ text: 'Manastır ve Selanik', hit: false }] },
];

const noop = () => {};

function quickSearch(props: Partial<Parameters<typeof QuickSearch>[0]> = {}) {
  return render(
    <QuickSearch
      visible
      query="selan"
      onChangeQuery={noop}
      results={results}
      labels={labels}
      onOpen={noop}
      onOpenAll={noop}
      onClose={noop}
      {...props}
    />,
  );
}

const rowsOf = (page: Node) => byRole(page, 'option').map(text);
// The group headings: the runs of text that are only a group's name.
const headingsOf = (page: Node) =>
  all(page)
    .filter((node) => node.children.every((child) => typeof child === 'string'))
    .map(text)
    .filter((words) => words === 'GİT' || words === 'NOTLAR');

describe('QuickSearch', () => {
  it('is a dialog with the box, named for screen readers', () => {
    const page = quickSearch();
    expect(byRole(page, 'dialog').map(nameOf)).toEqual(['Hızlı arama']);
    const field = all(page).find((node) => node.tag === 'input');
    expect(field?.attrs['aria-label']).toBe('Ara ya da git');
    expect(field?.attrs.value).toBe('selan');
  });

  it('shows nothing while closed', () => {
    expect(byRole(quickSearch({ visible: false }), 'dialog')).toEqual([]);
  });

  it('lists the Etiket, then the Kaynak under Git, the Notes under Notlar, and Ara last', () => {
    const page = quickSearch();
    expect(rowsOf(page)).toEqual([
      'ETİKETSelanik3 not',
      "KAYNAKSelanik'te Cemiyet MahfilleriArıkan · 2019",
      's. 112Selanik şubesi',
      'Manastır ve Selanik',
      "Ara'da tüm sonuçlar: «selan»⌘↵",
    ]);
    expect(headingsOf(page)).toEqual(['GİT', 'NOTLAR']);
  });

  it('marks the words the search matched in a Note', () => {
    const marked = all(quickSearch()).filter((node) => classes(node).includes('bg-mark'));
    expect(marked.map(text)).toEqual(['Selan']);
  });

  it('selects the first row on opening', () => {
    const selected = byRole(quickSearch(), 'option').filter((row) => row.attrs['aria-selected'] === 'true');
    expect(selected.map(text)).toEqual(['ETİKETSelanik3 not']);
  });

  it('leaves out a group with no results', () => {
    const page = quickSearch({ results: results.filter((result) => result.kind === 'note') });
    expect(headingsOf(page)).toEqual(['NOTLAR']);
    expect(rowsOf(page)[0]).toBe('s. 112Selanik şubesi');
  });

  it('says why in place of the results, and still offers Ara', () => {
    const page = quickSearch({ results: [], message: 'Sonuç yok.' });
    expect(text(page)).toContain('Sonuç yok.');
    expect(rowsOf(page)).toEqual(["Ara'da tüm sonuçlar: «selan»⌘↵"]);
  });

  it('names the keys at its foot', () => {
    expect(text(quickSearch())).toContain("↑↓seç↵aç⌘↵Ara'da aç");
  });
});
