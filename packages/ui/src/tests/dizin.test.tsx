import { describe, expect, it } from 'vitest';

import { CollectionRow, DizinColumn, TagRow } from '../dizin';
import { Text } from '../text';
import { all, byRole, classes, nameOf, render, text } from './render';

const noop = () => {};

const tagMenu = (open = false) => ({
  label: 'Selanik için işlemler',
  open,
  onOpenChange: noop,
  items: [
    { label: 'Yeniden adlandır', onPress: noop },
    { label: 'Birleştir…', onPress: noop },
    { label: 'Sil', tone: 'danger' as const, onPress: noop },
  ],
});

/** The element right around the ⋯ button: the slot that shows or hides it. */
const menuSlot = (page: ReturnType<typeof render>) =>
  all(page).find((node) =>
    node.children.some((child) => typeof child !== 'string' && child.attrs['aria-haspopup'] === 'menu'),
  )!;

describe('DizinColumn', () => {
  it('heads its rows with its name and count, then its own actions', () => {
    const page = render(
      <DizinColumn title="Dosyalar" count={3} actions={<Text variant="label">Son değişen ▾</Text>}>
        <Text variant="body">satırlar</Text>
      </DizinColumn>,
    );
    expect(byRole(page, 'region').map(nameOf)).toEqual(['Dosyalar']);
    expect(text(page)).toBe('DOSYALAR · 3Son değişen ▾satırlar');
  });

  it('leaves the count out until there is one', () => {
    const page = render(
      <DizinColumn title="Etiketler">
        <Text variant="body">satırlar</Text>
      </DizinColumn>,
    );
    expect(text(page)).toBe('ETİKETLERsatırlar');
  });
});

describe('CollectionRow', () => {
  const row = (props: Partial<Parameters<typeof CollectionRow>[0]> = {}) =>
    render(
      <CollectionRow
        name="İttihat ve Terakki"
        counts="15 not · 8 kaynak"
        tags={['İttihat ve Terakki', '1908']}
        noTags="etiketsiz"
        changed="dün"
        onPress={noop}
        {...props}
      />,
    );

  it('shows its name, counts, Tags and when it last changed', () => {
    const [press] = byRole(row(), 'button');
    expect(text(press!)).toBe('İttihat ve Terakki15 not · 8 kaynakİttihat ve Terakki1908dün');
  });

  // react-native-web presses a focused element on ↵ only when it has no native
  // action: a role="link" div has none, and ↵ would do nothing.
  it('is a button, which ↵ presses once ↑↓ or Tab put the focus on it, named all it shows', () => {
    expect(byRole(row(), 'link')).toEqual([]);
    expect(byRole(row(), 'button').map(nameOf)).toEqual([
      'İttihat ve Terakki, 15 not · 8 kaynak, İttihat ve Terakki · 1908, dün',
    ]);
  });

  it('says it has no Tags when it has none', () => {
    const [press] = byRole(row({ tags: [] }), 'button');
    expect(text(press!)).toBe('İttihat ve Terakki15 not · 8 kaynaketiketsizdün');
    expect(nameOf(press!)).toBe('İttihat ve Terakki, 15 not · 8 kaynak, etiketsiz, dün');
  });

  it('stands on the chip’s ground once ↑↓ chose it', () => {
    const [press] = byRole(row({ selected: true }), 'button');
    expect(press!.attrs['aria-current']).toBe('true');
    expect(classes(press!)).toContain('bg-chip-bg');
    expect(classes(byRole(row(), 'button')[0]!)).not.toContain('bg-chip-bg');
  });
});

describe('TagRow', () => {
  const row = (props: Partial<Parameters<typeof TagRow>[0]> = {}) =>
    render(<TagRow name="Selanik" counts="6 not · 1 kaynak" menu={tagMenu()} onPress={noop} {...props} />);

  it('is a button ↵ presses, with its name and counts, and a ⋯ beside it, not inside it', () => {
    const page = row();
    expect(byRole(page, 'link')).toEqual([]);
    const [press] = byRole(page, 'button');
    expect(text(press!)).toBe('Selanik6 not · 1 kaynak');
    expect(byRole(press!, 'button')).toEqual([]);
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Selanik, 6 not · 1 kaynak', 'Selanik için işlemler']);
  });

  it('keeps the ⋯ out of sight at rest, still there for the keyboard, its room kept', () => {
    const slot = menuSlot(row());
    expect(classes(slot)).toContain('opacity-0');
  });

  it('keeps the ⋯ in sight while its menu is open', () => {
    expect(classes(menuSlot(row({ menu: tagMenu(true) })))).toContain('opacity-100');
  });

  it('puts the row ↑↓ chose on the chip’s ground, its ⋯ in sight only with the focus', () => {
    const page = row({ selected: true });
    expect(byRole(page, 'button')[0]!.attrs['aria-current']).toBe('true');
    expect(all(page).some((node) => classes(node).includes('bg-chip-bg'))).toBe(true);
    expect(classes(menuSlot(page))).toContain('opacity-0');
  });

  it('opens the same three steps as on a phone', () => {
    const page = row({ menu: tagMenu(true) });
    expect(byRole(page, 'menuitem').map(nameOf)).toEqual(['Yeniden adlandır', 'Birleştir…', 'Sil']);
  });
});
