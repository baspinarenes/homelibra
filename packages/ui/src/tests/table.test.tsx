import { describe, expect, it } from 'vitest';

import { TableHead, TableRow, type TableColumn } from '../table';
import { all, byRole, classes, nameOf, render, text } from './render';

type Key = 'type' | 'title' | 'notes' | 'last';

const noop = () => {};

const columns: TableColumn<Key>[] = [
  { key: 'type', label: 'Tür', width: 110 },
  { key: 'title', label: 'Başlık', onSort: noop },
  { key: 'notes', label: 'Not', width: 56, align: 'end' },
  { key: 'last', label: 'Son not', width: 120, onSort: noop },
];

describe('TableHead', () => {
  it('heads each column in upper case, in order', () => {
    const page = render(<TableHead columns={columns} sort={{ column: 'last', direction: 'desc' }} />);
    expect(byRole(page, 'columnheader').map(text)).toEqual(['TÜR', 'BAŞLIK', 'NOT', 'SON NOT ↓']);
  });

  it('marks the column the rows are sorted by, with the way they run, in accent', () => {
    const page = render(<TableHead columns={columns} sort={{ column: 'title', direction: 'asc' }} />);
    const [type, title, , last] = byRole(page, 'columnheader');
    expect(title!.attrs['aria-sort']).toBe('ascending');
    expect(text(title!)).toBe('BAŞLIK ↑');
    expect(all(title!).some((node) => classes(node).includes('text-accent'))).toBe(true);
    // A column that sorts but does not now says so; one that cannot sort says nothing.
    expect(last!.attrs['aria-sort']).toBe('none');
    expect(type!.attrs['aria-sort']).toBeUndefined();
  });

  it('makes only the columns that sort into buttons', () => {
    const page = render(<TableHead columns={columns} sort={{ column: 'last', direction: 'desc' }} />);
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Başlık', 'Son not']);
  });
});

describe('TableRow', () => {
  const cells = { type: 'KİTAP', title: 'Hamidiye Basını ve Sansür', notes: '5', last: 'dün' };

  it("sets each column's cell in the columns' order", () => {
    const page = render(<TableRow columns={columns} cells={cells} onPress={noop} />);
    expect(byRole(page, 'row')).toHaveLength(1);
    expect(byRole(page, 'cell').map(text)).toEqual(['KİTAP', 'Hamidiye Basını ve Sansür', '5', 'dün']);
  });

  it('marks the chosen row on the chip ground, and only it', () => {
    const [chosen] = byRole(render(<TableRow columns={columns} cells={cells} selected onPress={noop} />), 'row');
    const [other] = byRole(render(<TableRow columns={columns} cells={cells} onPress={noop} />), 'row');
    expect(chosen!.attrs['aria-selected']).toBe('true');
    expect(classes(chosen!)).toContain('bg-chip-bg');
    expect(other!.attrs['aria-selected']).toBe('false');
    expect(classes(other!)).not.toContain('bg-chip-bg');
  });
});
