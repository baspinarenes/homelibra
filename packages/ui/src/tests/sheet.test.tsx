import Trash from 'lucide-react-native/icons/trash';
import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { Sheet, SheetAction } from '../sheet';
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
        secondary={{ label: 'Konumsuz', onPress: noop }}
        primary={{ label: 'Tamam', onPress: noop }}
      >
        <Text>s. 12</Text>
      </Sheet>,
    );
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Kapat', 'Konumsuz', 'Tamam']);
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

  it('is not there until opened', () => {
    const page = render(
      <Sheet visible={false} title="Konum" closeLabel="Kapat" onClose={noop}>
        <Text>s. 12</Text>
      </Sheet>,
    );
    expect(byRole(page, 'dialog')).toEqual([]);
  });
});

describe('SheetAction', () => {
  it('is a row named by what it does', () => {
    const page = render(<SheetAction icon={Trash} label="Kapağı kaldır" destructive onPress={noop} />);
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Kapağı kaldır']);
  });
});
