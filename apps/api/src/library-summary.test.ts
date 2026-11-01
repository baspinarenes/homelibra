import { uuidv7 } from 'uuidv7';
import { describe, expect, it } from 'vitest';

import { scholarEmail, testApi } from './test/harness';

const t = testApi();

async function scholar() {
  return (await t.signIn(scholarEmail())).call();
}

describe("Genel Bakış's Kütüphanen (#71)", () => {
  it('counts the Sources, Notes and Tags, the Sources by Tür, the most first, and by Reading status', async () => {
    const api = await scholar();
    const { id: kadi } = await api.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const { id: vakif } = await api.sources.create({ type: 'book', title: "Osmanlı'da Vakıf" });
    await api.sources.create({ type: 'archive', title: 'DH.MKT' });
    // One each: a tie, which goes in the glossary's order (article before periodical).
    await api.sources.create({ type: 'periodical', title: 'Tanin' });
    await api.sources.create({ type: 'archive', title: 'A.MKT.MHM' });
    await api.sources.create({ type: 'article', title: 'Kadı Sicilleri' });
    await api.notes.create({ id: uuidv7(), sourceId: kadi, excerpt: 'Naib atandı.', tags: ['kadılık', 'taşra'] });
    await api.notes.create({ id: uuidv7(), sourceId: kadi, excerpt: 'Sicil tutuldu.', tags: ['kadılık'] });
    await api.notes.create({ id: uuidv7(), sourceId: vakif, excerpt: 'Vakfiye yazıldı.' });
    await api.sources.setReadingStatus({ id: vakif, status: 'finished' });

    expect(await api.sources.library()).toEqual({
      sourceCount: 6,
      noteCount: 3,
      tagCount: 2,
      types: [
        { type: 'book', count: 2 },
        { type: 'archive', count: 2 },
        { type: 'article', count: 1 },
        { type: 'periodical', count: 1 },
      ],
      reading: 5,
      finished: 1,
    });
  });

  it('is all zeros for an empty Library, and never counts another Library', async () => {
    const other = await scholar();
    await other.sources.create({ type: 'book', title: 'Taşrada Kadı ve Naib' });
    const api = await scholar();

    expect(await api.sources.library()).toEqual({
      sourceCount: 0,
      noteCount: 0,
      tagCount: 0,
      types: [],
      reading: 0,
      finished: 0,
    });
  });
});
