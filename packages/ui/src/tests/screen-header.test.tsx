import Trash from 'lucide-react-native/icons/trash';
import { describe, expect, it } from 'vitest';

import { HeaderIconAction, HeaderTextAction, ScreenHeader } from '../screen-header';
import { all, byRole, nameOf, render, text } from './render';

const noop = () => {};

describe('ScreenHeader', () => {
  it("puts a pushed screen's title right after the back arrow", () => {
    const page = render(<ScreenHeader title="Yeni kaynak" onBack={noop} backLabel="Geri" />);
    const [back] = byRole(page, 'button');
    const [heading] = byRole(page, 'heading');
    expect(nameOf(back!)).toBe('Geri');
    expect(text(heading!)).toBe('Yeni kaynak');
    const order = all(page);
    expect(order.indexOf(back!)).toBeLessThan(order.indexOf(heading!));
  });

  it('sets a prefix before the title', () => {
    const page = render(
      <ScreenHeader prefix="Dosya: " title="İttihat ve Terakki makalesi" onBack={noop} backLabel="Geri" />,
    );
    expect(text(byRole(page, 'heading')[0]!)).toBe('Dosya: İttihat ve Terakki makalesi');
  });

  it('gives a tab root its large title and no back arrow', () => {
    const page = render(<ScreenHeader variant="root" title="Kaynaklar" />);
    expect(byRole(page, 'button')).toEqual([]);
    expect(text(byRole(page, 'heading')[0]!)).toBe('Kaynaklar');
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
});

describe('HeaderIconAction', () => {
  it('lights a dot over its icon while what it opens is in effect (a filter is on)', () => {
    const [plain] = byRole(render(<HeaderIconAction icon={Trash} label="Süz ve sırala" onPress={noop} />), 'button');
    const [lit] = byRole(render(<HeaderIconAction icon={Trash} label="Süz ve sırala" dot onPress={noop} />), 'button');
    expect(all(lit!).length).toBe(all(plain!).length + 1);
  });
});
