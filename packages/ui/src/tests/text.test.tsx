import { describe, expect, it } from 'vitest';

import { Text } from '../text';
import { all, byRole, classes, type Node, render, text } from './render';

/** The innermost element showing `words`: the Text itself, under the page's own wrappers. */
const drawn = (element: Parameters<typeof render>[0], words: string): Node =>
  all(render(element)).findLast((n) => n.children.includes(words))!;

describe('Text', () => {
  it("draws a caption in its entry's face, size and line, in muted", () => {
    expect(classes(drawn(<Text variant="caption">Okunuyor</Text>, 'Okunuyor'))).toEqual(['type-caption', 'text-muted']);
  });

  // The colour most of the app set each entry in by hand before #145; light and dark come from the theme.
  it.each([
    ['body', 'text-ink2'],
    ['sourceTitle', 'text-fg'],
    ['excerpt', 'text-quote-ink'],
    ['comment', 'text-ink3'],
    ['link', 'text-accent'],
    ['heading', 'text-muted'],
  ] as const)('sets %s in its own colour', (variant, colour) => {
    const word = drawn(<Text variant={variant}>Tanin</Text>, variant === 'heading' ? 'TANİN' : 'Tanin');
    expect(classes(word)).toContain(colour);
  });

  it('takes another colour from the theme by name', () => {
    const error = drawn(
      <Text variant="caption" color="danger">
        Bağlantı kurulamadı
      </Text>,
      'Bağlantı kurulamadı',
    );
    expect(classes(error)).toEqual(['type-caption', 'text-danger']);
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
    expect(classes(line)).toContain('text-warn');
    expect(classes(word)).toEqual(['type-strong']);
    expect(
      classes(
        drawn(
          <Text variant="strong" color="accent">
            Kaynağı aç
          </Text>,
          'Kaynağı aç',
        ),
      ),
    ).toEqual(['type-strong', 'text-accent']);
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
    const row = drawn(
      <Text variant="body" className="mt-1.5 shrink">
        Tanin
      </Text>,
      'Tanin',
    );
    expect(classes(row)).toEqual(['type-body', 'text-ink2', 'mt-1.5', 'shrink']);
  });
});
