import { describe, expect, it } from 'vitest';

import { collectionToMarkdown, type MarkdownNote, type MarkdownSource, sourceToMarkdown } from '../markdown';

const book = (source: Partial<MarkdownSource>): MarkdownSource => ({
  author: null,
  title: 'Başlık',
  date: null,
  ...source,
});
const note = (n: Partial<MarkdownNote>): MarkdownNote => ({ locator: null, excerpt: null, comment: null, ...n });

describe('collectionToMarkdown', () => {
  it('writes #12’s example exactly', () => {
    const markdown = collectionToMarkdown({
      name: 'İttihat ve Terakki',
      groups: [
        {
          source: { author: 'BOA', title: 'Y.PRK.ASK', date: { calendar: 'hijri', year: 1325, month: 12, day: 29 } },
          notes: [
            note({ locator: '254/12', excerpt: "Manastır ve Selanik'te zâbitânın ekserisi cemiyete dahil olmuştur." }),
          ],
        },
        {
          source: {
            author: 'Selim Uğurlu',
            title: "Ahmet Rıza'dan Talat Paşa'ya: Cemiyetin Taşra Teşkilatı",
            date: { calendar: 'gregorian', year: 2014 },
          },
          notes: [
            note({ comment: 'Genel değerlendirme: taşra şubelerini merkezden bağımsız ele alan nadir çalışmalardan.' }),
            note({
              locator: 's. 45',
              excerpt: 'Şubelerin çoğu, merkezden talimat beklemeden kendi nizamnamelerini yazdı.',
            }),
          ],
        },
      ],
    });

    expect(markdown).toBe(
      [
        '# İttihat ve Terakki',
        '',
        '## BOA, Y.PRK.ASK (29 Z 1325)',
        '',
        '**254/12**',
        '',
        "> Manastır ve Selanik'te zâbitânın ekserisi cemiyete dahil olmuştur.",
        '',
        "## Selim Uğurlu, Ahmet Rıza'dan Talat Paşa'ya: Cemiyetin Taşra Teşkilatı (2014)",
        '',
        'Genel değerlendirme: taşra şubelerini merkezden bağımsız ele alan nadir çalışmalardan.',
        '',
        '**s. 45**',
        '',
        '> Şubelerin çoğu, merkezden talimat beklemeden kendi nizamnamelerini yazdı.',
        '',
      ].join('\n'),
    );
  });

  it('is only the heading for a Collection with no Notes', () => {
    expect(collectionToMarkdown({ name: 'Taslak', groups: [] })).toBe('# Taslak\n');
  });
});

describe('sourceToMarkdown', () => {
  it.each([
    [
      'Yazar, Başlık and Tarih',
      book({ author: 'Ahmed Cevdet', title: 'Tezâkir', date: { calendar: 'gregorian', year: 1986 } }),
      '## Ahmed Cevdet, Tezâkir (1986)',
    ],
    [
      'no Yazar',
      book({ title: 'Takvim-i Vekayi', date: { calendar: 'rumi', year: 1310 } }),
      '## Takvim-i Vekayi (1310 r.)',
    ],
    ['a blank Yazar', book({ author: '  ', title: 'Takvim-i Vekayi' }), '## Takvim-i Vekayi'],
    ['no Tarih: an archive file names itself', book({ author: 'BOA', title: 'DH.MKT' }), '## BOA, DH.MKT'],
    [
      'a Rumî day with its month in full',
      book({ title: 'Sabah', date: { calendar: 'rumi', year: 1327, month: 1, day: 12 } }),
      '## Sabah (12 Kânunusani 1327)',
    ],
    [
      'a Hicrî month alone',
      book({ title: 'Defter', date: { calendar: 'hijri', year: 1310, month: 12 } }),
      '## Defter (Z 1310)',
    ],
  ])('heads a Source with %s', (_, source, heading) => {
    expect(sourceToMarkdown(source, []).split('\n')[0]).toBe(heading);
  });

  it('puts a Note without a Locator right under the heading, with no Locator line', () => {
    expect(sourceToMarkdown(book({ title: 'Tezâkir' }), [note({ locator: '  ', excerpt: 'Eserin bütünü.' })])).toBe(
      '## Tezâkir\n\n> Eserin bütünü.\n',
    );
  });

  it('writes a Note’s Comment as a plain paragraph after its Excerpt, always', () => {
    expect(
      sourceToMarkdown(book({ title: 'Tezâkir' }), [
        note({ locator: 's. 12', excerpt: 'Kadı azledildi.', comment: 'Tarihi tutmuyor.' }),
      ]),
    ).toBe('## Tezâkir\n\n**s. 12**\n\n> Kadı azledildi.\n\nTarihi tutmuyor.\n');
  });

  it('quotes every paragraph of a long Excerpt', () => {
    expect(
      sourceToMarkdown(book({ title: 'Tezâkir' }), [
        note({ locator: 's. 3', excerpt: 'Birinci paragraf.\n\nİkinci paragraf,\nalt satırıyla.' }),
      ]),
    ).toBe('## Tezâkir\n\n**s. 3**\n\n> Birinci paragraf.\n>\n> İkinci paragraf,\n> alt satırıyla.\n');
  });

  it('leaves out Tags and İlk baskı tarihi', () => {
    const source = {
      ...book({ author: 'Ahmed Cevdet', title: 'Tezâkir', date: { calendar: 'gregorian', year: 1986 } }),
      fields: { firstEditionDate: { calendar: 'gregorian', year: 1953 } },
      tags: [{ name: 'Tanzimat' }],
    };
    const tagged = { ...note({ locator: 's. 1', excerpt: 'Alıntı.' }), tags: [{ name: 'kadı' }] };

    const markdown = sourceToMarkdown(source, [tagged]);

    expect(markdown).toBe('## Ahmed Cevdet, Tezâkir (1986)\n\n**s. 1**\n\n> Alıntı.\n');
  });

  it('keeps the Notes in the order given, the screen’s', () => {
    const markdown = sourceToMarkdown(book({ title: 'Tezâkir' }), [
      note({ locator: 's. 9', excerpt: 'Dokuz.' }),
      note({ locator: 's. 2', excerpt: 'İki.' }),
    ]);

    expect(markdown.indexOf('Dokuz.')).toBeLessThan(markdown.indexOf('İki.'));
  });
});
