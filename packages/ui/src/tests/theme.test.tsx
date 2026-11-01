import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import {
  fonts,
  keepThemePreferenceIn,
  palette,
  radius,
  setThemePreference,
  type ThemePreference,
  type as typeScale,
  useTheme,
} from '../theme';
import { render, text } from './render';

function Probe() {
  const { scheme, colors } = useTheme();
  return <Text>{`${scheme} ${colors.page}`}</Text>;
}

// Each face's hhea ascent + descent over its units per em, read from the @expo-google-fonts files:
// EB Garamond 1007 + 298 / 1000, Charis SIL 2450 + 900 / 2048, Reddit Sans and Mono 2068 + 592 / 2048.
const faceHeight: Record<(typeof fonts)[keyof typeof fonts], number> = {
  [fonts.serif]: 1.305,
  [fonts.serifMedium]: 1.305,
  [fonts.quote]: 1.636,
  [fonts.sans]: 1.299,
  [fonts.sansMedium]: 1.299,
  [fonts.sansSemiBold]: 1.299,
  [fonts.mono]: 1.299,
  [fonts.monoRegular]: 1.299,
};

const sized = Object.entries(typeScale).flatMap(([name, entry]) => ('fontSize' in entry ? [{ name, ...entry }] : []));

describe('theme', () => {
  it('has the tight corner scale', () => {
    expect(radius).toEqual({ cover: 3, chip: 6, control: 8, sheet: 12, pill: 999 });
  });

  // A shorter line and Android cuts the glyphs: the foot of g and ş in Hoş geldin.
  it.each(sized)('gives $name a line as tall as its face', ({ fontFamily, fontSize, lineHeight }) => {
    expect(lineHeight).toBeGreaterThanOrEqual(fontSize * faceHeight[fontFamily]);
  });

  // The rule over an identifier card's foot (Kaynak formu): on-accent at 30%, as the canvas mixes it.
  it.each(['light', 'dark'] as const)('rules on accent with accentFg at 30%% in %s', (scheme) => {
    const { accentFg, accentRule } = palette[scheme];
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(accentFg.slice(i, i + 2), 16));
    expect(accentRule).toBe(`rgba(${r},${g},${b},0.3)`);
  });

  it('follows the system until a choice is kept', () => {
    expect(text(render(<Probe />))).toBe('light #F6F2EA');
  });

  it('starts from the choice the app kept and stores each new one there', () => {
    const saved: ThemePreference[] = [];
    keepThemePreferenceIn({ load: () => 'dark', save: (choice) => saved.push(choice) });
    expect(text(render(<Probe />))).toBe('dark #1C1813');

    setThemePreference('light');
    expect(text(render(<Probe />))).toBe('light #F6F2EA');
    expect(saved).toEqual(['light']);
  });
});
