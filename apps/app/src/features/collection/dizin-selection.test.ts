import { describe, expect, it } from 'vitest';

import { inDizin, stepInDizin } from '@/features/collection/dizin-selection';

const rows = { collections: ['ittihat', 'basin'], tags: ['selanik', '1908', 'ordu'] };
const tag = (id: string) => ({ column: 'tags' as const, id });
const collection = (id: string) => ({ column: 'collections' as const, id });

describe('↑↓ in a wide Dizin (#181)', () => {
  it('starts at the first Collection', () => {
    expect(stepInDizin(rows, null, 'next')).toEqual(collection('ittihat'));
    expect(stepInDizin(rows, null, 'previous')).toEqual(collection('ittihat'));
  });

  it('starts at the first Tag while there is no Collection', () => {
    expect(stepInDizin({ collections: [], tags: rows.tags }, null, 'next')).toEqual(tag('selanik'));
  });

  it('has nowhere to go with neither', () => {
    expect(stepInDizin({ collections: [], tags: [] }, null, 'next')).toBeNull();
  });

  it('moves within the column of the chosen row, stopping at its ends', () => {
    expect(stepInDizin(rows, tag('selanik'), 'next')).toEqual(tag('1908'));
    expect(stepInDizin(rows, tag('ordu'), 'next')).toEqual(tag('ordu'));
    expect(stepInDizin(rows, tag('selanik'), 'previous')).toEqual(tag('selanik'));
    expect(stepInDizin(rows, collection('basin'), 'previous')).toEqual(collection('ittihat'));
  });

  it('starts over at its column’s top once the chosen row is gone (deleted, merged)', () => {
    expect(stepInDizin(rows, tag('gone'), 'next')).toEqual(tag('selanik'));
  });
});

describe('The chosen row', () => {
  it('is none once it is gone from its column', () => {
    expect(inDizin(rows, tag('ordu'))).toEqual(tag('ordu'));
    expect(inDizin(rows, tag('ittihat'))).toBeNull();
    expect(inDizin(rows, null)).toBeNull();
  });
});
