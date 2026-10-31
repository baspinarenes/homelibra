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
