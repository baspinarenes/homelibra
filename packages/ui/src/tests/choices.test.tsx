import { describe, expect, it } from 'vitest';

import { Chip } from '../chip';
import { Segment } from '../segment';
import { Switch } from '../switch';
import { all, byRole, css, nameOf, render, text } from './render';

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

  it('takes a Tag out with its own × button', () => {
    const page = render(<Chip label="sansür" onRemove={noop} removeLabel="“sansür” etiketini çıkar" />);
    const buttons = byRole(page, 'button');
    expect(buttons.map(nameOf)).toEqual(['“sansür” etiketini çıkar']);
    expect(text(page)).toBe('sansür');
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

  it('sits in a toolbar row when compact: tighter options, smaller words', () => {
    const options = [
      { value: 'excerpt', label: 'Alıntı' },
      { value: 'comment', label: 'Yorum' },
    ] as const;
    const draw = (compact: boolean) =>
      render(<Segment compact={compact} label="Not" options={options} value="excerpt" onChange={noop} />);
    const [option] = byRole(draw(true), 'radio');
    const [word] = all(option!);
    // The toolbar row of Not yazma alanı: 4/11 inside each option, 13px words.
    expect(css(option!, 'paddingBlock')).toBe('4px');
    expect(css(option!, 'paddingInline')).toBe('11px');
    expect(css(word!, 'fontSize')).toBe('13px');
    const [regular] = byRole(draw(false), 'radio');
    expect(css(regular!, 'paddingBlock')).toBe('6px');
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
