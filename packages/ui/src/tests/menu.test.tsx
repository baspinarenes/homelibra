import { describe, expect, it } from 'vitest';

import { type MenuItem, MoreMenu } from '../menu';
import { all, byRole, classes, nameOf, render, text } from './render';

const noop = () => {};

const items: MenuItem[] = [
  { label: 'Markdown olarak kopyala', keys: '⌘⇧C', onPress: noop },
  { label: 'Dosyayı sil', tone: 'danger', onPress: noop },
];

const menu = (open: boolean, more: MenuItem[] = items) =>
  render(<MoreMenu label="Diğer" items={more} open={open} onOpenChange={noop} />);

describe('MoreMenu', () => {
  it('closed, is only its ⋯ button, saying it opens a menu', () => {
    const page = menu(false);
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Diğer']);
    const [button] = byRole(page, 'button');
    expect(button!.attrs['aria-expanded']).toBe('false');
    expect(button!.attrs['aria-haspopup']).toBe('menu');
    expect(byRole(page, 'menuitem')).toEqual([]);
  });

  it('open, lists its items in order, each with the key that does the same', () => {
    const page = menu(true);
    expect(byRole(page, 'button')[0]!.attrs['aria-expanded']).toBe('true');
    expect(byRole(page, 'menu')).toHaveLength(1);
    expect(byRole(page, 'menuitem').map(nameOf)).toEqual(['Markdown olarak kopyala', 'Dosyayı sil']);
    expect(text(byRole(page, 'menuitem')[0]!)).toBe('Markdown olarak kopyala⌘⇧C');
  });

  it('sets an item that cannot be taken back in the danger colour', () => {
    const [, remove] = byRole(menu(true), 'menuitem');
    const word = all(remove!).find(
      (node) => text(node) === 'Dosyayı sil' && classes(node).some((c) => c.startsWith('type-')),
    );
    expect(classes(word!)).toContain('text-danger');
  });

  it('greys out an item with nothing to act on', () => {
    const [copy] = byRole(menu(true, [{ ...items[0]!, disabled: true }]), 'menuitem');
    expect(copy!.attrs['aria-disabled']).toBe('true');
  });
});

describe('MoreMenu with a choice', () => {
  const orders: MenuItem[] = [
    { label: 'Son değişen', checked: true, onPress: noop },
    { label: 'Ada göre', checked: false, onPress: noop },
  ];
  const choice = (open: boolean) =>
    render(
      <MoreMenu
        label="Dosyaları sırala: son değişen"
        trigger="Son değişen"
        items={orders}
        open={open}
        onOpenChange={noop}
      />,
    );

  it('shows the choice in force on its button, with ▾, in place of ⋯', () => {
    const [button] = byRole(choice(false), 'button');
    expect(nameOf(button!)).toBe('Dosyaları sırala: son değişen');
    expect(text(button!)).toBe('Son değişen ▾');
  });

  it('marks the choice in force among its options', () => {
    const options = byRole(choice(true), 'menuitemradio');
    expect(options.map(nameOf)).toEqual(['Son değişen', 'Ada göre']);
    expect(options.map((option) => option.attrs['aria-checked'])).toEqual(['true', 'false']);
    expect(byRole(choice(true), 'menuitem')).toEqual([]);
  });
});
