import { describe, expect, it } from 'vitest';

import { InlineChoices } from '../inline-choices';
import { all, byRole, classes, nameOf, render, text } from './render';

const noop = () => {};

const themes = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
] as const;

describe('InlineChoices', () => {
  it('sets the name of the setting before its options, the options side by side as one choice', () => {
    const page = render(<InlineChoices label="Tema" options={themes} value="light" onChange={noop} />);
    const [group] = byRole(page, 'radiogroup');
    expect(nameOf(group!)).toBe('Tema');
    const options = byRole(page, 'radio');
    expect(options.map(text)).toEqual(['Sistem', 'Açık', 'Koyu']);
    expect(options.map((option) => option.attrs['aria-checked'])).toEqual(['false', 'true', 'false']);
    expect(text(page)).toBe('TemaSistemAçıkKoyu');
  });

  it('keeps the names in one 160 px column, so the options of every row start on one line', () => {
    const page = render(<InlineChoices label="Kaldığın yer" options={themes} value="system" onChange={noop} />);
    const column = all(page).filter((node) => classes(node).includes('w-[160px]'));
    expect(column.map(text)).toEqual(['Kaldığın yer']);
  });

  it('joins the buttons, a rule between each two, the chosen one on accent', () => {
    const options = byRole(
      render(<InlineChoices label="Tema" options={themes} value="light" onChange={noop} />),
      'radio',
    );
    expect(options.map((option) => classes(option).includes('border-l'))).toEqual([false, true, true]);
    expect(options.map((option) => classes(option).includes('bg-accent'))).toEqual([false, true, false]);
  });
});
