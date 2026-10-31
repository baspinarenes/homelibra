import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { keepThemePreferenceIn, palette, radius, setThemePreference, type ThemePreference, useTheme } from '../theme';
import { render, text } from './render';

function Probe() {
  const { scheme, colors } = useTheme();
  return <Text>{`${scheme} ${colors.page}`}</Text>;
}

describe('theme', () => {
  it('has the tight corner scale', () => {
    expect(radius).toEqual({ cover: 3, chip: 6, control: 8, sheet: 12, pill: 999 });
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
