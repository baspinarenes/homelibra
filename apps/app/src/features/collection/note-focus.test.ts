import { describe, expect, it } from 'vitest';

import { placeInSource, siblingsOf, stepInView } from './note-focus';

// Two Sources in the view: Uğurlu with three of its five Notes (s. 201 is in no Tag of the file), Arıkan with two.
const view = {
  groups: [
    { source: { id: 'ugurlu' }, notes: [{ id: 'u1' }, { id: 'u3' }, { id: 'u4' }] },
    { source: { id: 'arikan' }, notes: [{ id: 'a1' }, { id: 'a2' }] },
  ],
};

const ugurlu = [
  { id: 'u1', locator: null, excerpt: null, comment: 'Genel değerlendirme.' },
  { id: 'u2', locator: 'Önsöz', excerpt: null, comment: 'Kaynak eleştirisi kısa.' },
  { id: 'u3', locator: 's. 45', excerpt: 'Şubelerin çoğu kendi nizamnamelerini yazdı.', comment: null },
  { id: 'u4', locator: 's. 112–114', excerpt: 'Selanik şubesi merkezin yerini almıştı.', comment: 'Dipnot 48.' },
  { id: 'u5', locator: 's. 201', excerpt: "Enver Bey'in dağa çıkışı.", comment: null },
];

const at = (sourceId: string, noteId: string) => ({ sourceId, noteId });

describe('stepInView', () => {
  it('goes to the row after or before, across the Sources', () => {
    expect(stepInView(view, at('ugurlu', 'u3'), 'next')).toEqual(at('ugurlu', 'u4'));
    expect(stepInView(view, at('ugurlu', 'u4'), 'next')).toEqual(at('arikan', 'a1'));
    expect(stepInView(view, at('arikan', 'a1'), 'previous')).toEqual(at('ugurlu', 'u4'));
  });

  it('stays on the first and the last row', () => {
    expect(stepInView(view, at('ugurlu', 'u1'), 'previous')).toEqual(at('ugurlu', 'u1'));
    expect(stepInView(view, at('arikan', 'a2'), 'next')).toEqual(at('arikan', 'a2'));
  });

  it('with no Note open starts at the first row going down, the last going up', () => {
    expect(stepInView(view, null, 'next')).toEqual(at('ugurlu', 'u1'));
    expect(stepInView(view, null, 'previous')).toEqual(at('arikan', 'a2'));
  });

  it('from a Note with no row (one the file does not hold) goes to the nearest row by its place in the Source', () => {
    const order = ugurlu.map((note) => note.id);
    expect(stepInView(view, at('ugurlu', 'u2'), 'next', order)).toEqual(at('ugurlu', 'u3'));
    expect(stepInView(view, at('ugurlu', 'u2'), 'previous', order)).toEqual(at('ugurlu', 'u1'));
    expect(stepInView(view, at('ugurlu', 'u5'), 'previous', order)).toEqual(at('ugurlu', 'u4'));
    expect(stepInView(view, at('ugurlu', 'u5'), 'next', order)).toEqual(at('arikan', 'a1'));
  });

  it('from a Note with no row, its Source’s order not known yet, goes into its Source’s rows', () => {
    expect(stepInView(view, at('ugurlu', 'u5'), 'next')).toEqual(at('ugurlu', 'u1'));
    expect(stepInView(view, at('ugurlu', 'u5'), 'previous')).toEqual(at('ugurlu', 'u4'));
  });

  it('from a Note whose Source has no rows left (the search narrowed it away) goes to the view’s ends', () => {
    expect(stepInView(view, at('gone', 'g1'), 'next')).toEqual(at('ugurlu', 'u1'));
    expect(stepInView(view, at('gone', 'g1'), 'previous')).toEqual(at('arikan', 'a2'));
  });

  it('has nowhere to go in an empty view', () => {
    expect(stepInView({ groups: [] }, null, 'next')).toBeNull();
  });
});

describe('placeInSource', () => {
  it('counts the Note among all its Source’s Notes, in Locator order, with those either side', () => {
    expect(placeInSource(ugurlu, 'u4')).toEqual({
      n: 4,
      total: 5,
      previous: { id: 'u3', locator: 's. 45' },
      next: { id: 'u5', locator: 's. 201' },
    });
  });

  it('has nothing before the first Note and nothing after the last', () => {
    expect(placeInSource(ugurlu, 'u1')).toMatchObject({ n: 1, previous: null, next: { id: 'u2' } });
    expect(placeInSource(ugurlu, 'u5')).toMatchObject({ n: 5, previous: { id: 'u4' }, next: null });
  });

  it('is unknown for a Note the list does not hold (yet)', () => {
    expect(placeInSource(ugurlu, 'zz')).toBeNull();
  });
});

describe('siblingsOf', () => {
  it('lists the Source’s other Notes by their Excerpt, or Comment, saying which the view holds', () => {
    const inView = new Set(['u1', 'u3', 'u4']);
    expect(siblingsOf(ugurlu, 'u4', (id) => inView.has(id))).toEqual([
      { id: 'u1', locator: null, text: 'Genel değerlendirme.', inView: true },
      { id: 'u2', locator: 'Önsöz', text: 'Kaynak eleştirisi kısa.', inView: false },
      { id: 'u3', locator: 's. 45', text: 'Şubelerin çoğu kendi nizamnamelerini yazdı.', inView: true },
      { id: 'u5', locator: 's. 201', text: "Enver Bey'in dağa çıkışı.", inView: false },
    ]);
  });
});
