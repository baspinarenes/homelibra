import { describe, expect, it } from 'vitest';

import { contentsOf, sectionAt } from './contents';

const section = (heading: string) => ({ heading, paragraphs: ['…'] });

describe('contentsOf', () => {
  it('lists the headings of a text with three of them, in order', () => {
    expect(contentsOf([section('Hizmet'), section('Kullanım'), section('İletişim')])).toEqual([
      'Hizmet',
      'Kullanım',
      'İletişim',
    ]);
  });

  it('lists nothing for a text with two headings', () => {
    expect(contentsOf([section('Hizmet'), section('İletişim')])).toBeNull();
  });
});

describe('sectionAt', () => {
  // Three sections starting 0, 400 and 900 px down a 3000 px text, read through a 600 px window.
  const text = { tops: [0, 400, 900], viewport: 600, content: 3000 };

  it('is the section whose heading has scrolled to the top or past it', () => {
    expect(sectionAt({ ...text, offset: 450 })).toBe(1);
  });

  it('is the last section once the text is scrolled to its end, short as that section may be', () => {
    const short = { tops: [0, 400, 2900], viewport: 600, content: 3000 };
    expect(sectionAt({ ...short, offset: 2400 })).toBe(2);
  });
});
