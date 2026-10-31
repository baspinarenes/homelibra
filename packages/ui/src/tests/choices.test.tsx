import { describe, expect, it } from 'vitest';

import { Chip } from '../chip';
import { Segment } from '../segment';
import { Switch } from '../switch';
import { byRole, nameOf, render, text } from './render';

const noop = () => {};

describe('Chip', () => {
  it('toggles when it can be chosen, and says whether it is', () => {
    const page = render(
      <>
        <Chip label="Kitap" selected onPress={noop} />
        <Chip label="Makale" selected={false} onPress={noop} />
      </>,
    );
    const chips = byRole(page, 'button');
    expect(chips.map(nameOf)).toEqual(['Kitap', 'Makale']);
    expect(chips.map((chip) => chip.attrs['aria-pressed'])).toEqual(['true', 'false']);
  });

  it('only shows a status', () => {
    const page = render(<Chip label="4 etiketsiz" tone="warn" />);
    expect(byRole(page, 'button')).toEqual([]);
    expect(text(page)).toBe('4 etiketsiz');
  });

  it('marks a chosen Tag that a press takes off with ×', () => {
    const [chip] = byRole(render(<Chip label="sansür" selected removable onPress={noop} />), 'button');
    expect(text(chip!)).toBe('sansür ×');
    expect(nameOf(chip!)).toBe('sansür');
  });
});

describe('Segment', () => {
  it('offers its options as one choice, the chosen one checked', () => {
    const page = render(
      <Segment
        label="Ara"
        options={[
          { value: 'all', label: 'Tümü' },
          { value: 'notes', label: 'Notlar' },
          { value: 'sources', label: 'Kaynaklar' },
        ]}
        value="notes"
        onChange={noop}
      />,
    );
    const [group] = byRole(page, 'radiogroup');
    expect(nameOf(group!)).toBe('Ara');
    const options = byRole(page, 'radio');
    expect(options.map(text)).toEqual(['Tümü', 'Notlar', 'Kaynaklar']);
    expect(options.map((option) => option.attrs['aria-checked'])).toEqual(['false', 'true', 'false']);
  });
});

describe('Switch', () => {
  it('is a switch named by what it turns on', () => {
    const [toggle] = byRole(
      render(<Switch label="Etiketli kaynakların tüm notları" value onChange={noop} />),
      'switch',
    );
    expect(nameOf(toggle!)).toBe('Etiketli kaynakların tüm notları');
    expect(toggle!.attrs['aria-checked']).toBe('true');
  });
});
