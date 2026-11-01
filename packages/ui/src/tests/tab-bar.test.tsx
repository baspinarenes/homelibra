import { describe, expect, it } from 'vitest';

import { TabBar, type TabBarTab } from '../tab-bar';
import { byRole, nameOf, render, text } from './render';

const tabs: TabBarTab[] = [
  { key: 'home', label: 'Genel bakış', icon: 'overview' },
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
    expect(shown.map(text)).toEqual(['Genel bakış', 'Kaynaklar', 'Dizin', 'Ara', 'Ayarlar']);
    expect(shown.map((tab) => tab.attrs['aria-selected'])).toEqual(['false', 'false', 'true', 'false', 'false']);
  });

  describe('a dot on Genel bakış when there are Sources to organize', () => {
    const dotted = tabs.map((tab) =>
      tab.key === 'home' ? { ...tab, dot: 'Genel bakış, düzenlenecek kaynak var' } : tab,
    );

    it('is said aloud while another tab is open', () => {
      const [overview] = byRole(render(<TabBar tabs={dotted} active="sources" onPress={noop} />), 'tab');
      expect(nameOf(overview!)).toBe('Genel bakış, düzenlenecek kaynak var');
    });

    it('goes while Genel bakış itself is open', () => {
      const [overview] = byRole(render(<TabBar tabs={dotted} active="home" onPress={noop} />), 'tab');
      expect(nameOf(overview!)).toBe('Genel bakış');
    });

    it('is not there when there is nothing to organize', () => {
      const [overview] = byRole(render(<TabBar tabs={tabs} active="sources" onPress={noop} />), 'tab');
      expect(nameOf(overview!)).toBe('Genel bakış');
    });
  });
});
