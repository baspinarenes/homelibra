import { describe, expect, it } from 'vitest';

import {
  inOrder,
  naturalOrder,
  orderAfterPress,
  orderOf,
  storedOrder,
  storedOrders,
  stepSelection,
} from './source-order';

describe('orderAfterPress', () => {
  it('sorts by a new column in its own direction: Son not newest first, the others from A or the oldest', () => {
    const byLast = naturalOrder('last');
    expect(orderAfterPress(byLast, 'title')).toEqual({ sort: 'title', direction: 'asc' });
    expect(orderAfterPress(byLast, 'date')).toEqual({ sort: 'date', direction: 'asc' });
    expect(orderAfterPress({ sort: 'title', direction: 'desc' }, 'last')).toEqual({ sort: 'last', direction: 'desc' });
  });

  it('turns the direction round on a second press of the same column, and back on a third', () => {
    const once = orderAfterPress(naturalOrder('last'), 'author');
    const twice = orderAfterPress(once, 'author');
    expect(twice).toEqual({ sort: 'author', direction: 'desc' });
    expect(orderAfterPress(twice, 'author')).toEqual({ sort: 'author', direction: 'asc' });
  });
});

describe('storedOrder and orderOf', () => {
  it('reads back what it kept', () => {
    const order = { sort: 'date', direction: 'desc' } as const;
    expect(orderOf(storedOrder(order))).toEqual(order);
  });

  it('opens by Son not, newest first, when nothing was kept', () => {
    // What loadDeviceChoice falls back on.
    expect(orderOf(storedOrders[0])).toEqual({ sort: 'last', direction: 'desc' });
  });
});

type Row = { title: string; author: string | null; date: object | null; lastNoteAt: string | null };
const row = (title: string, fields: Partial<Row> = {}): Row => ({
  title,
  author: null,
  date: null,
  lastNoteAt: null,
  ...fields,
});

describe('inOrder', () => {
  // As `sources.list` sends them by Yazar: A to Z, the Sources without a Yazar last, by Başlık.
  const byAuthor = [
    row('Hamidiye Basını', { author: 'Ayşe Demirtaş' }),
    row('Cemiyet ve Ordu', { author: 'Kemal Ersoy' }),
    row('Taşra Teşkilatı', { author: 'Selim Uğurlu' }),
    row('Sabah'),
    row('Tanin'),
  ];
  const titles = (rows: Row[]) => rows.map((source) => source.title);

  it('keeps the list as it came in its own direction', () => {
    expect(titles(inOrder(byAuthor, { sort: 'author', direction: 'asc' }))).toEqual(titles(byAuthor));
  });

  it('turns the list round the other way, the Sources without a Yazar still last', () => {
    expect(titles(inOrder(byAuthor, { sort: 'author', direction: 'desc' }))).toEqual([
      'Taşra Teşkilatı',
      'Cemiyet ve Ordu',
      'Hamidiye Basını',
      'Sabah',
      'Tanin',
    ]);
  });

  it('puts the oldest noted first by Son not turned round, the Sources without a Note still last', () => {
    const byLast = [
      row('Dün', { lastNoteAt: '2026-11-14T10:00:00.000Z' }),
      row('Geçen hafta', { lastNoteAt: '2026-11-08T10:00:00.000Z' }),
      row('Notsuz'),
    ];
    expect(titles(inOrder(byLast, { sort: 'last', direction: 'asc' }))).toEqual(['Geçen hafta', 'Dün', 'Notsuz']);
  });

  it('keeps the undated last by Tarih turned round', () => {
    const byDate = [row('1908', { date: {} }), row('2014', { date: {} }), row('Tarihsiz')];
    expect(titles(inOrder(byDate, { sort: 'date', direction: 'desc' }))).toEqual(['2014', '1908', 'Tarihsiz']);
  });

  it('runs from Z to A by Başlık turned round', () => {
    const byTitle = [row('Ahmet Rıza'), row('Hamidiye'), row('Tanin')];
    expect(titles(inOrder(byTitle, { sort: 'title', direction: 'desc' }))).toEqual(['Tanin', 'Hamidiye', 'Ahmet Rıza']);
  });
});

describe('stepSelection', () => {
  const ids = ['a', 'b', 'c'];

  it('starts at the first row, going down or up', () => {
    expect(stepSelection(ids, null, 'next')).toBe('a');
    expect(stepSelection(ids, null, 'previous')).toBe('a');
  });

  it('moves one row at a time and stops at either end', () => {
    expect(stepSelection(ids, 'a', 'next')).toBe('b');
    expect(stepSelection(ids, 'b', 'previous')).toBe('a');
    expect(stepSelection(ids, 'c', 'next')).toBe('c');
    expect(stepSelection(ids, 'a', 'previous')).toBe('a');
  });

  it('starts over when the chosen row is no longer in the list', () => {
    expect(stepSelection(ids, 'gone', 'next')).toBe('a');
  });

  it('chooses nothing in an empty list', () => {
    expect(stepSelection([], null, 'next')).toBeNull();
  });
});
