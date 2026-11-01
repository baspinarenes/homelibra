import { describe, expect, it } from 'vitest';

import { Button } from '../button';
import { byRole, nameOf, render } from './render';

const noop = () => {};

describe('Button', () => {
  it('is a button named by its label', () => {
    const [button] = byRole(render(<Button label="Kaydet" onPress={noop} />), 'button');
    expect(nameOf(button!)).toBe('Kaydet');
    expect(button!.attrs['aria-disabled']).toBeUndefined();
  });

  it('cannot be pressed while disabled', () => {
    const [button] = byRole(render(<Button label="Kaydet" disabled onPress={noop} />), 'button');
    expect(button!.attrs['aria-disabled']).toBe('true');
  });

  it('spins while busy, keeps its name and cannot be pressed again', () => {
    const page = render(<Button label="Hesabımı sil" variant="danger" busy onPress={noop} />);
    const [button] = byRole(page, 'button');
    expect(nameOf(button!)).toBe('Hesabımı sil');
    expect(button!.attrs['aria-disabled']).toBe('true');
    expect(byRole(page, 'progressbar')).toHaveLength(1);
  });
});
