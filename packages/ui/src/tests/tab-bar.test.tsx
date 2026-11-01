import { describe, expect, it } from 'vitest';

import { TabBar, type TabBarTab } from '../tab-bar';
import { byRole, render, text } from './render';

const tabs: TabBarTab[] = [
  { key: 'home', label: 'Genel Bakış', icon: 'overview' },
  { key: 'sources', label: 'Kaynaklar', icon: 'sources' },
  { key: 'index', label: 'Dizin', icon: 'index' },
  { key: 'search', label: 'Ara', icon: 'search' },
  { key: 'settings', label: 'Ayarlar', icon: 'settings' },
];

const noop = () => {};

describe('TabBar', () => {
  it('shows the five tabs in order, the open one selected', () => {
    const page = render(<TabBar tabs={tabs} active="index" onPress={noop} />);
    const shown = byRole(page, 'tab');
    expect(shown.map(text)).toEqual(['Genel Bakış', 'Kaynaklar', 'Dizin', 'Ara', 'Ayarlar']);
    expect(shown.map((tab) => tab.attrs['aria-selected'])).toEqual(['false', 'false', 'true', 'false', 'false']);
  });
});
