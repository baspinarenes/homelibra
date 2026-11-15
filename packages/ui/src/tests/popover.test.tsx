import { Pressable } from 'react-native';
import { describe, expect, it } from 'vitest';

import { AnchoredPopover } from '../popover';
import { Text } from '../text';
import { byRole, classes, nameOf, render, text } from './render';

const noop = () => {};

const popover = (open: boolean) =>
  render(
    <AnchoredPopover
      open={open}
      onOpenChange={noop}
      role="dialog"
      label="Arama ipuçları"
      className="w-[380px] p-lg"
      trigger={({ ref, onPress }) => (
        <Pressable ref={ref} role="button" aria-label="Arama ipuçları" aria-expanded={open} onPress={onPress}>
          <Text variant="button">?</Text>
        </Pressable>
      )}
    >
      <Text variant="body">Nerede arar</Text>
    </AnchoredPopover>,
  );

describe('AnchoredPopover', () => {
  it('closed, is only the button that opens it', () => {
    const page = popover(false);
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Arama ipuçları']);
    expect(byRole(page, 'dialog')).toEqual([]);
  });

  it('open, holds what it is given, in its role and name, over the page', () => {
    const page = popover(true);
    const [surface] = byRole(page, 'dialog');
    expect(nameOf(surface!)).toBe('Arama ipuçları');
    expect(text(surface!)).toBe('Nerede arar');
    expect(classes(surface!)).toEqual(expect.arrayContaining(['absolute', 'shadow-lift', 'w-[380px]', 'p-lg']));
  });

  it('stands at the top right by its classes until its button is measured, with no style of its own', () => {
    const [surface] = byRole(popover(true), 'dialog');
    expect(classes(surface!)).toEqual(expect.arrayContaining(['top-0', 'right-0']));
    expect(surface!.attrs.style ?? '').not.toMatch(/top|right/);
  });
});
