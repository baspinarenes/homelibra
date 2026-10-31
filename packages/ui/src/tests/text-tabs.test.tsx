import { Text } from 'react-native';
import { describe, expect, it } from 'vitest';

import { TextTabs } from '../text-tabs';
import { byRole, nameOf, render, text } from './render';

const noop = () => {};

describe('TextTabs', () => {
  it('names each view with its count, the open one selected', () => {
    const page = render(
      <TextTabs
        label="Dizin"
        options={[
          { value: 'collections', label: 'Dosyalar', count: 5 },
          { value: 'tags', label: 'Etiketler', count: 48 },
        ]}
        value="tags"
        onChange={noop}
      />,
    );
    const [list] = byRole(page, 'tablist');
    expect(nameOf(list!)).toBe('Dizin');
    const tabs = byRole(page, 'tab');
    expect(tabs.map(nameOf)).toEqual(['Dosyalar 5', 'Etiketler 48']);
    expect(tabs.map((tab) => tab.attrs['aria-selected'])).toEqual(['false', 'true']);
  });

  it('leaves out a count it was not given', () => {
    const page = render(
      <TextTabs
        label="Dizin"
        options={[
          { value: 'collections', label: 'Dosyalar' },
          { value: 'tags', label: 'Etiketler', count: 48 },
        ]}
        value="collections"
        onChange={noop}
      />,
    );
    const [first] = byRole(page, 'tab');
    expect(text(first!)).toBe('Dosyalar');
    expect(nameOf(first!)).toBe('Dosyalar');
  });

  it('keeps what stands at the far end outside the tabs', () => {
    const page = render(
      <TextTabs
        label="Dizin"
        options={[{ value: 'collections', label: 'Dosyalar' }]}
        value="collections"
        onChange={noop}
        right={<Text>Sırala</Text>}
      />,
    );
    const [list] = byRole(page, 'tablist');
    expect(text(page)).toContain('Sırala');
    expect(text(list!)).not.toContain('Sırala');
  });
});
