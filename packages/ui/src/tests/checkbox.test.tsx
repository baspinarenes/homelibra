import { describe, expect, it } from 'vitest';

import { Checkbox } from '../checkbox';
import { byRole, nameOf, render, text } from './render';

const noop = () => {};

describe('Checkbox', () => {
  it('is one checkbox for the whole row, named by its label', () => {
    const [box, ...rest] = byRole(render(<Checkbox label="Kapağı da kullan" checked onChange={noop} />), 'checkbox');
    expect(rest).toEqual([]);
    expect(nameOf(box!)).toBe('Kapağı da kullan');
    expect(box!.attrs['aria-checked']).toBe('true');
  });

  it('says when it is not checked', () => {
    const [box] = byRole(render(<Checkbox label="Kapağı da kullan" checked={false} onChange={noop} />), 'checkbox');
    expect(box!.attrs['aria-checked']).toBe('false');
  });

  it('cannot be changed while disabled', () => {
    const [box] = byRole(render(<Checkbox label="Devre dışı" checked disabled onChange={noop} />), 'checkbox');
    expect(box!.attrs['aria-disabled']).toBe('true');
  });

  it('can stand alone in a row, its label only for screen readers', () => {
    const [box] = byRole(render(<Checkbox label="Notu seç" hideLabel checked={false} onChange={noop} />), 'checkbox');
    expect(nameOf(box!)).toBe('Notu seç');
    expect(text(box!)).toBe('');
  });
});
