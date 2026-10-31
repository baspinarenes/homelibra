import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { TextTabs } from '../text-tabs';
import { byRole, nameOf, render, text } from './render';

const noop = () => {};

describe('TextTabs', () => {
  it('offers its views as tabs, each with its count, the open one selected', () => {
    const page = render(
      <TextTabs
        label="Okuma durumu"
        options={[
          { value: 'reading', label: 'Okunuyor', count: 4 },
          { value: 'finished', label: 'Bitti', count: 0 },
        ]}
        value="reading"
        onChange={noop}
      />,
    );
    const [list] = byRole(page, 'tablist');
    expect(nameOf(list!)).toBe('Okuma durumu');
    const tabs = byRole(page, 'tab');
    expect(tabs.map(nameOf)).toEqual(['Okunuyor 4', 'Bitti 0']);
    expect(tabs.map((tab) => tab.attrs['aria-selected'])).toEqual(['true', 'false']);
  });

  it('leaves out a count it is not given', () => {
    const page = render(
      <TextTabs
        label="Dizin"
        options={[
          { value: 'collections', label: 'Dosyalar', count: 5 },
          { value: 'tags', label: 'Etiketler' },
        ]}
        value="tags"
        onChange={noop}
      />,
    );
    expect(byRole(page, 'tab').map(nameOf)).toEqual(['Dosyalar 5', 'Etiketler']);
  });

  it('keeps what the screen puts at the row’s right outside the tabs', () => {
    const page = render(
      <TextTabs
        label="Dizin"
        options={[{ value: 'collections', label: 'Dosyalar' }]}
        value="collections"
        onChange={noop}
        right={<Text>Sırala</Text>}
      />,
    );
    expect(text(byRole(page, 'tablist')[0]!)).toBe('Dosyalar');
    expect(text(page)).toBe('DosyalarSırala');
  });
});
