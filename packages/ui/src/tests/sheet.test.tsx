import Trash from 'lucide-react-native/icons/trash';
import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { Sheet, SheetAction, SheetField } from '../sheet';
import { byRole, nameOf, render, text } from './render';

const noop = () => {};

describe('Sheet', () => {
  it('is named by its title and closes only with Kapat', () => {
    const page = render(
      <Sheet visible title="Dosyanın etiketleri" closeLabel="Kapat" onClose={noop}>
        <Text>ittihat</Text>
      </Sheet>,
    );
    const [sheet] = byRole(page, 'dialog');
    expect(nameOf(sheet!)).toBe('Dosyanın etiketleri');
    expect(text(sheet!)).toContain('ittihat');
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Kapat']);
  });

  it('puts the main action last, a secondary one before it', () => {
    const page = render(
      <Sheet
        visible
        title="Konum"
        closeLabel="Kapat"
        onClose={noop}
        secondary={{ label: 'Konum yok', onPress: noop }}
        primary={{ label: 'Tamam', onPress: noop }}
      >
        <Text>s. 12</Text>
      </Sheet>,
    );
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Kapat', 'Konum yok', 'Tamam']);
  });

  it('stands at its full height, 48 below the top, when its body is a list that scrolls itself', () => {
    const style = (fill: boolean) => {
      const page = render(
        <Sheet visible fill={fill} title="Kaynak seç" closeLabel="Kapat" onClose={noop}>
          <Text>Osmanlı Belgelerinin Dili</Text>
        </Sheet>,
      );
      return byRole(page, 'dialog')[0]!.attrs.style ?? '';
    };
    // A sheet that fits its content may grow to a height; one that fills stands at it.
    const tallest = /max-height:([-\d.]+px)/.exec(style(false))?.[1];
    expect(tallest).toBeDefined();
    expect(style(false)).not.toMatch(/(^|;)height:/);
    expect(style(true)).toMatch(new RegExp(`(^|;)height:${tallest}`));
  });

  it("keeps 14 clear of the phone's navigation bar", () => {
    const page = render(
      <Sheet visible title="Filtrele" closeLabel="Kapat" onClose={noop} primary={{ label: 'Uygula', onPress: noop }}>
        <Text>Yıllar</Text>
      </Sheet>,
    );
    // The render helper's phone has a 20px gesture bar.
    expect(byRole(page, 'dialog')[0]!.attrs.style).toMatch(/padding-bottom:34px/);
  });

  it('is not there until opened', () => {
    const draw = (visible: boolean) =>
      render(
        <Sheet visible={visible} title="Konum" closeLabel="Kapat" onClose={noop}>
          <Text>s. 12</Text>
        </Sheet>,
      );
    expect(byRole(draw(true), 'dialog')).toHaveLength(1);
    expect(byRole(draw(false), 'dialog')).toEqual([]);
  });
});

describe('SheetAction', () => {
  it('is a row named by what it does', () => {
    const page = render(<SheetAction icon={Trash} label="Kapağı kaldır" destructive onPress={noop} />);
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Kapağı kaldır']);
  });
});

describe('SheetField', () => {
  it('labels its control in Turkish upper case, above it', () => {
    const page = render(
      <SheetField label="Tür">
        <Text>Kitap</Text>
      </SheetField>,
    );
    expect(text(page)).toBe('TÜRKitap');
  });
});
