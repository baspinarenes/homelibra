import { describe, expect, it } from 'vitest';

import { locatorSortValue, mergeNotes } from '../note';

const start = Date.parse('2026-10-30T09:00:00Z');

/** A UUIDv7 for a Note captured this many minutes into the reading. */
const idAt = (minute: number) => {
  const hex = (start + minute * 60_000).toString(16).padStart(12, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8)}-7000-8000-000000000000`;
};

type Draft = { locator: string | null; excerpt?: string; comment?: string; tags?: string[] };
const note = (minute: number, { locator, excerpt, comment, tags = [] }: Draft) => ({
  id: idAt(minute),
  locator,
  locatorSort: locator === null ? null : locatorSortValue(locator),
  excerpt: excerpt ?? null,
  comment: comment ?? null,
  tags,
});

describe('mergeNotes', () => {
  it('joins a quotation cut by a page turn, in Locator order whatever order they were picked in (#13, scenario 4)', () => {
    // The second half was captured first, with a Tag; the first half later, untagged.
    const second = note(0, { locator: 's. 28', excerpt: 've naibin tayini kadıya aitti.', tags: ['naib'] });
    const first = note(5, { locator: 's. 27', excerpt: 'Taşrada yargı', tags: [] });

    expect(mergeNotes([second, first])).toEqual({
      id: first.id,
      locator: 's. 27',
      locatorSort: [27],
      excerpt: 'Taşrada yargı\n\nve naibin tayini kadıya aitti.',
      comment: null,
      tags: ['naib'],
    });
  });

  it('joins the Comments the same way, skipping Notes without one, and pools the Tags once each', () => {
    const notes = [
      note(0, { locator: 's. 45', excerpt: 'Birinci.', comment: 'Önemli.', tags: ['kadı', 'vekâlet'] }),
      note(1, { locator: 's. 46', excerpt: 'İkinci.', tags: ['Vekâlet'] }),
      note(2, { locator: 's. 47', comment: 'Dizinle karşılaştır.', tags: ['naib'] }),
    ];

    expect(mergeNotes(notes)).toMatchObject({
      excerpt: 'Birinci.\n\nİkinci.',
      comment: 'Önemli.\n\nDizinle karşılaştır.',
      tags: ['kadı', 'vekâlet', 'naib'],
    });
  });

  it("takes the first Note's Locator and sort value, a corrected one too, even when it has none", () => {
    const corrected = { ...note(3, { locator: 'vr. 12', excerpt: 'Varak.' }), locatorSort: [12.5] };
    expect(mergeNotes([note(0, { locator: 'vr. 13', excerpt: 'Sonra.' }), corrected])).toMatchObject({
      id: corrected.id,
      locator: 'vr. 12',
      locatorSort: [12.5],
    });

    // Konumsuz comes first in Locator order: the merged Note speaks of the whole Source.
    const whole = note(9, { locator: null, comment: 'Genel.' });
    expect(mergeNotes([note(0, { locator: 's. 3', excerpt: 'Bir.' }), whole])).toMatchObject({
      id: whole.id,
      locator: null,
      locatorSort: null,
      excerpt: 'Bir.',
      comment: 'Genel.',
    });
  });

  it('keeps capture order between Notes of the same Locator', () => {
    const later = note(7, { locator: 's. 12', excerpt: 'İkinci yarı.' });
    const earlier = note(2, { locator: 's. 12', excerpt: 'İlk yarı' });

    expect(mergeNotes([later, earlier])).toMatchObject({ id: earlier.id, excerpt: 'İlk yarı\n\nİkinci yarı.' });
  });
});
