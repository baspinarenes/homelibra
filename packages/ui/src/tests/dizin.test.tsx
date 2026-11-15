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

  it('is a link with its name, counts, Tags and when it last changed', () => {
    const [link] = byRole(row(), 'link');
    expect(text(link!)).toBe('İttihat ve Terakki15 not · 8 kaynakİttihat ve Terakki1908dün');
  });

  it('says it has no Tags when it has none', () => {
    expect(text(byRole(row({ tags: [] }), 'link')[0]!)).toBe('İttihat ve Terakki15 not · 8 kaynaketiketsizdün');
  });

  it('stands on the chip’s ground once ↑↓ chose it', () => {
    const [link] = byRole(row({ selected: true }), 'link');
    expect(link!.attrs['aria-selected']).toBe('true');
    expect(classes(link!)).toContain('bg-chip-bg');
    expect(classes(byRole(row(), 'link')[0]!)).not.toContain('bg-chip-bg');
  });
});

describe('TagRow', () => {
  const row = (props: Partial<Parameters<typeof TagRow>[0]> = {}) =>
    render(<TagRow name="Selanik" counts="6 not · 1 kaynak" menu={tagMenu()} onPress={noop} {...props} />);

  it('is a link with its name and counts, and a ⋯ beside it, not inside it', () => {
    const page = row();
    const [link] = byRole(page, 'link');
    expect(text(link!)).toBe('Selanik6 not · 1 kaynak');
    expect(byRole(link!, 'button')).toEqual([]);
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Selanik için işlemler']);
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
    expect(byRole(page, 'link')[0]!.attrs['aria-selected']).toBe('true');
    expect(all(page).some((node) => classes(node).includes('bg-chip-bg'))).toBe(true);
    expect(classes(menuSlot(page))).toContain('opacity-0');
  });

  it('opens the same three steps as on a phone', () => {
    const page = row({ menu: tagMenu(true) });
    expect(byRole(page, 'menuitem').map(nameOf)).toEqual(['Yeniden adlandır', 'Birleştir…', 'Sil']);
  });
});
