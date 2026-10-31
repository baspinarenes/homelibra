import { describe, expect, it } from 'vitest';

import { SheetChoices } from '../sheet';
import { byRole, nameOf, render } from './render';

const noop = () => {};

describe('SheetChoices', () => {
  it('offers its options as one choice, the chosen one checked', () => {
    const page = render(
      <SheetChoices
        label="Dosyaları sırala"
        options={[
          { value: 'recent', label: 'Son değişen' },
          { value: 'name', label: 'Ada göre' },
          { value: 'notes', label: 'Not sayısı' },
        ]}
        value="name"
        onChange={noop}
      />,
    );
    const [group] = byRole(page, 'radiogroup');
    expect(nameOf(group!)).toBe('Dosyaları sırala');
    const options = byRole(page, 'radio');
    expect(options.map(nameOf)).toEqual(['Son değişen', 'Ada göre', 'Not sayısı']);
    expect(options.map((option) => option.attrs['aria-checked'])).toEqual(['false', 'true', 'false']);
  });
});
