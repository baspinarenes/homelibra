import { describe, expect, it } from 'vitest';

import { TermTable } from '../term-table';
import { byRole, render, text } from './render';

const rows = [
  { term: 'kutuphane.json', description: 'Başka bir araca taşımak için.' },
  { term: 'kapaklar/', description: 'Kaynakların kapakları.' },
];

describe('TermTable', () => {
  it('is a table with a row for each term, in order', () => {
    const [table] = byRole(render(<TermTable rows={rows} />), 'table');
    expect(byRole(table!, 'row').map(text)).toEqual([
      'kutuphane.jsonBaşka bir araca taşımak için.',
      'kapaklar/Kaynakların kapakları.',
    ]);
  });

  it('heads each row with its term and gives the description its own cell', () => {
    const page = render(<TermTable rows={rows} />);
    expect(byRole(page, 'rowheader').map(text)).toEqual(['kutuphane.json', 'kapaklar/']);
    expect(byRole(page, 'cell').map(text)).toEqual(['Başka bir araca taşımak için.', 'Kaynakların kapakları.']);
  });

  it('has no column headings', () => {
    const page = render(<TermTable rows={rows} />);
    expect(byRole(page, 'row')).toHaveLength(2);
    expect(byRole(page, 'columnheader')).toEqual([]);
  });
});
