import { StyleSheet } from 'react-native';
import { describe, expect, it } from 'vitest';

import { Text } from '../text';
import { setThemePreference } from '../theme';
import { all, byRole, css, type Node, render, text } from './render';

/** The innermost element showing `words`: the Text itself, under the page's own wrappers. */
const drawn = (element: Parameters<typeof render>[0], words: string): Node =>
  all(render(element)).findLast((n) => n.children.includes(words))!;

describe('Text', () => {
  it("draws a caption in its entry's face, size and line, in muted", () => {
    const caption = drawn(<Text variant="caption">Okunuyor</Text>, 'Okunuyor');
    expect(css(caption, 'fontSize')).toBe('12.5px');
    expect(css(caption, 'lineHeight')).toBe('17px');
    expect(css(caption, 'color')).toBe('rgba(117,108,96,1.00)');
  });

  // The colour most of the app set each entry in by hand before #145, light and dark.
  it.each([
    ['body', 'rgba(106,99,88,1.00)', 'rgba(187,178,164,1.00)'],
    ['sourceTitle', 'rgba(42,37,32,1.00)', 'rgba(240,232,219,1.00)'],
    ['excerpt', 'rgba(74,68,59,1.00)', 'rgba(208,199,185,1.00)'],
    ['comment', 'rgba(63,58,51,1.00)', 'rgba(226,217,203,1.00)'],
    ['link', 'rgba(166,90,64,1.00)', 'rgba(208,138,110,1.00)'],
    ['heading', 'rgba(117,108,96,1.00)', 'rgba(152,142,128,1.00)'],
  ] as const)('sets %s in its own colour', (variant, light, dark) => {
    const word = () => drawn(<Text variant={variant}>Tanin</Text>, variant === 'heading' ? 'TANİN' : 'Tanin');
    expect(css(word(), 'color')).toBe(light);
    setThemePreference('dark');
    try {
      expect(css(word(), 'color')).toBe(dark);
    } finally {
      setThemePreference('system');
    }
  });

  it('takes another colour from the theme by name', () => {
    const error = drawn(
      <Text variant="caption" color="danger">
        Bağlantı kurulamadı
      </Text>,
      'Bağlantı kurulamadı',
    );
    expect(css(error, 'color')).toBe('rgba(163,53,43,1.00)');
  });

  it("takes the dark theme's colours in the dark theme", () => {
    setThemePreference('dark');
    try {
      expect(css(drawn(<Text variant="caption">Okunuyor</Text>, 'Okunuyor'), 'color')).toBe('rgba(152,142,128,1.00)');
      expect(
        css(
          drawn(
            <Text variant="caption" color="danger">
              Hata
            </Text>,
            'Hata',
          ),
          'color',
        ),
      ).toBe('rgba(238,142,128,1.00)');
    } finally {
      setThemePreference('system');
    }
  });

  // A locale-blind upper case gives ISTANBUL and IRAK's dotted twin; Turkish needs İ and I.
  it.each(['screenTitle', 'heading', 'fieldLabel', 'micro'] as const)('sets %s in Turkish upper case', (variant) => {
    const page = render(
      <>
        <Text variant={variant}>istanbul</Text>
        <Text variant={variant}>ırak</Text>
      </>,
    );
    expect(text(page)).toBe('İSTANBULIRAK');
  });

  it('leaves the other entries as written', () => {
    expect(text(render(<Text variant="caption">istanbul</Text>))).toBe('istanbul');
  });

  it.each(['display', 'title', 'screenTitle', 'sourceTitle', 'heading'] as const)('makes %s a heading', (variant) => {
    expect(byRole(render(<Text variant={variant}>Tanin</Text>), 'heading')).toHaveLength(1);
  });

  it('makes no heading of running text, unless asked', () => {
    expect(byRole(render(<Text variant="body">Tanin</Text>), 'heading')).toHaveLength(0);
    expect(
      byRole(
        render(
          <Text variant="body" role="heading">
            Tanin
          </Text>,
        ),
        'heading',
      ),
    ).toHaveLength(1);
  });

  it('lets a heading entry stand as plain text', () => {
    expect(byRole(render(<Text variant="sourceTitle">Tanin</Text>), 'heading')).toHaveLength(1);
    expect(
      byRole(
        render(
          <Text variant="sourceTitle" role={undefined}>
            Tanin
          </Text>,
        ),
        'heading',
      ),
    ).toHaveLength(0);
  });

  // Inside a line, a heavier word takes that line's colour; a link names its own.
  it('gives strong no colour of its own', () => {
    const page = render(
      <Text variant="body" color="warn">
        Bağlantı yok. <Text variant="strong">Yeniden dene</Text>
      </Text>,
    );
    const word = all(page).findLast((n) => n.children.includes('Yeniden dene'))!;
    const line = all(page).findLast((n) => n.children.includes(word))!;
    expect(css(line, 'color')).toBe('rgba(143,94,20,1.00)');
    expect(css(word, 'color')).toBeUndefined();
    expect(css(word, 'fontFamily')).toBeDefined();
    expect(
      css(
        drawn(
          <Text variant="strong" color="accent">
            Kaynağı aç
          </Text>,
          'Kaynağı aç',
        ),
        'color',
      ),
    ).toBe('rgba(166,90,64,1.00)');
  });

  // Checked by `pnpm typecheck`: a face, size, line or colour comes only from the entry and `color`,
  // and an upper-case entry's words are one string, so none escapes toLocaleUpperCase('tr').
  it('refuses a face, a size or a colour in style, and an upper-case entry built of parts', () => {
    const refused = (
      <>
        {/* eslint-disable no-restricted-syntax -- the very size the type refuses */}
        {/* @ts-expect-error fontSize comes from the entry */}
        <Text variant="body" style={{ fontSize: 18 }}>
          {/* eslint-enable no-restricted-syntax */}
          Tanin
        </Text>
        {/* @ts-expect-error the colour is named with `color` */}
        <Text variant="body" style={{ color: 'red' }}>
          Tanin
        </Text>
        {/* @ts-expect-error a colour outside the theme */}
        <Text variant="body" color="red">
          Tanin
        </Text>
        {/* @ts-expect-error a heading's words are one string */}
        <Text variant="heading">
          Okunuyor <Text variant="strong">3</Text>
        </Text>
      </>
    );
    expect(refused).toBeDefined();
  });

  it('lays out as the screen says', () => {
    const { row: style } = StyleSheet.create({ row: { marginTop: 6, flexShrink: 1 } });
    const row = drawn(
      <Text variant="body" style={style}>
        Tanin
      </Text>,
      'Tanin',
    );
    expect(css(row, 'marginTop')).toBe('6px');
    expect(css(row, 'fontSize')).toBe('15px');
  });
});
