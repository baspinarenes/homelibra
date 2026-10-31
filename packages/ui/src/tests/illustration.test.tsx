import { afterEach, describe, expect, it } from 'vitest';

import { BookIllustration } from '../illustration';
import { setThemePreference } from '../theme';
import { all, render } from './render';

const colours = (page: ReturnType<typeof render>) =>
  new Set(all(page).flatMap((n) => [n.attrs.fill, n.attrs.stroke].filter(Boolean)));

afterEach(() => setThemePreference('system'));

describe('BookIllustration', () => {
  it('is decoration, so screen readers skip it', () => {
    const [svg] = all(render(<BookIllustration />)).filter((n) => n.tag === 'svg');
    expect(svg!.attrs['aria-hidden']).toBe('true');
  });

  it('draws the book, its quote and its tag in the light theme', () => {
    const used = colours(render(<BookIllustration />));
    // pages on the surface, the ribbon in the accent, the tag as a chip
    for (const colour of ['#FFFEFB', '#A65A40', '#EFE7D7', '#6C5E3F', '#DCC9B0']) expect(used).toContain(colour);
  });

  it('and in the dark one, with none of the light colours left', () => {
    const light = ['#FFFEFB', '#A65A40', '#EFE7D7'];
    setThemePreference('light');
    const before = colours(render(<BookIllustration />));
    for (const colour of light) expect(before).toContain(colour);
    setThemePreference('dark');
    const used = colours(render(<BookIllustration />));
    for (const colour of ['#262019', '#D08A6E', '#33291B', '#D8BC8E', '#4D4234']) expect(used).toContain(colour);
    for (const colour of light) expect(used).not.toContain(colour);
  });
});
