import Trash from 'lucide-react-native/icons/trash';
import { describe, expect, it } from 'vitest';

import { HeaderIconAction, HeaderTextAction, ScreenHeader } from '../screen-header';
import { all, byRole, css, type Node, nameOf, render, text } from './render';

const noop = () => {};

describe('ScreenHeader', () => {
  it("puts a pushed screen's title right after the back arrow", () => {
    const page = render(<ScreenHeader title="Yeni kaynak" onBack={noop} backLabel="Geri" />);
    const [back] = byRole(page, 'button');
    const [heading] = byRole(page, 'heading');
    expect(nameOf(back!)).toBe('Geri');
    expect(text(heading!)).toBe('YENİ KAYNAK');
    const order = all(page);
    expect(order.indexOf(back!)).toBeLessThan(order.indexOf(heading!));
  });

  it("sets a page's name in upper case, the Turkish way", () => {
    const page = render(<ScreenHeader title="Genel Bakış" />);
    expect(text(byRole(page, 'heading')[0]!)).toBe('GENEL BAKIŞ');
  });

  it('keeps the letters of a name the scholar wrote, only its prefix in upper case', () => {
    const page = render(
      <ScreenHeader prefix="Dosya: " title="İttihat ve Terakki makalesi" onBack={noop} backLabel="Geri" />,
    );
    expect(text(byRole(page, 'heading')[0]!)).toBe('DOSYA: İttihat ve Terakki makalesi');
  });

  it('makes the title a button when it can be tapped, the prefix kept', () => {
    const page = render(
      <ScreenHeader prefix="Dosya: " title="Matbuat ve sansür" onTitlePress={noop} onBack={noop} backLabel="Geri" />,
    );
    const [, title] = byRole(page, 'button');
    expect(text(title!)).toBe('DOSYA: Matbuat ve sansür');
    expect(byRole(title!, 'heading')).toHaveLength(1);
  });

  it('lets a word in the header tell screen readers more than it shows', () => {
    const page = render(
      <HeaderTextAction label="Dosya yap" accessibilityLabel="Bu etiketten dosya yap" onPress={noop} />,
    );
    const [action] = byRole(page, 'button');
    expect(text(action!)).toBe('Dosya yap');
    expect(nameOf(action!)).toBe('Bu etiketten dosya yap');
  });

  it('gives a tab root its title and no back arrow', () => {
    const page = render(<ScreenHeader title="Kaynaklar" />);
    expect(byRole(page, 'button')).toEqual([]);
    expect(text(byRole(page, 'heading')[0]!)).toBe('KAYNAKLAR');
  });

  it('sets the title in mono 15/20 with a 1px rule underneath', () => {
    const page = render(<ScreenHeader title="Kaynaklar" />);
    const [heading] = byRole(page, 'heading');
    expect(css(heading!, 'fontSize')).toBe('15px');
    expect(css(heading!, 'lineHeight')).toBe('20px');
    expect(css(heading!, 'letterSpacing')).toBe('2.2px');
    const ruled = all(page).filter((n) => all(n).includes(heading!) && css(n, 'borderBottomWidth') === '1px');
    expect(ruled).toHaveLength(1);
  });

  it('keeps the title on a 44 bar with icons or without, so it never shifts between screens', () => {
    const bar = (page: Node) => {
      const [heading] = byRole(page, 'heading');
      return all(page).filter((n) => all(n).includes(heading!) && css(n, 'height') === '44px');
    };
    const bare = render(<ScreenHeader title="Genel Bakış" />);
    const withIcons = render(
      <ScreenHeader
        title="Kaynaklar"
        right={
          <>
            <HeaderIconAction icon={Trash} label="Sırala" size={24} onPress={noop} />
            <HeaderIconAction icon={Trash} label="Filtrele" size={24} onPress={noop} />
          </>
        }
      />,
    );
    expect(bar(bare)).toHaveLength(1);
    expect(bar(withIcons)).toHaveLength(1);
  });

  it("sets an icon right beside a tab root's title, before the actions at the right", () => {
    const page = render(
      <ScreenHeader
        title="Ara"
        titleAccessory={<HeaderIconAction icon={Trash} label="Arama ipuçları" tone="muted" onPress={noop} />}
        right={<HeaderIconAction icon={Trash} label="Filtrele" onPress={noop} />}
      />,
    );
    const [heading] = byRole(page, 'heading');
    const [tips, filter] = byRole(page, 'button');
    expect(text(heading!)).toBe('ARA');
    expect(nameOf(tips!)).toBe('Arama ipuçları');
    expect(nameOf(filter!)).toBe('Filtrele');
    const order = all(page);
    expect(order.indexOf(heading!)).toBeLessThan(order.indexOf(tips!));
  });

  it('shows its actions at the right, a disabled Kaydet among them', () => {
    const page = render(
      <ScreenHeader
        title="Yeni kaynak"
        onBack={noop}
        backLabel="Geri"
        right={
          <>
            <HeaderIconAction icon={Trash} label="Kaynağı sil" tone="danger" onPress={noop} />
            <HeaderTextAction label="Kaydet" disabled onPress={noop} />
          </>
        }
      />,
    );
    const [, remove, save] = byRole(page, 'button');
    expect(nameOf(remove!)).toBe('Kaynağı sil');
    expect(nameOf(save!)).toBe('Kaydet');
    expect(save!.attrs['aria-disabled']).toBe('true');
  });

  it('spins in place of Kaydet while saving, keeps its name and takes no second press', () => {
    const page = render(<HeaderTextAction label="Kaydet" busy onPress={noop} />);
    const [save] = byRole(page, 'button');
    expect(nameOf(save!)).toBe('Kaydet');
    expect(text(save!)).toBe('');
    expect(save!.attrs['aria-busy']).toBe('true');
    expect(save!.attrs['aria-disabled']).toBe('true');
    expect(byRole(page, 'progressbar')).toHaveLength(1);
  });
});

describe('HeaderIconAction', () => {
  it('lights a dot over its icon while what it opens is in effect (a filter is on)', () => {
    const [plain] = byRole(render(<HeaderIconAction icon={Trash} label="Filtrele" onPress={noop} />), 'button');
    const [lit] = byRole(render(<HeaderIconAction icon={Trash} label="Filtrele" dot onPress={noop} />), 'button');
    expect(all(lit!).length).toBe(all(plain!).length + 1);
  });
});
