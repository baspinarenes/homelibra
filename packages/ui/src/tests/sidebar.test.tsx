import { describe, expect, it } from 'vitest';

import { Sidebar, type SidebarFile, type SidebarLabels } from '../sidebar';
import { all, byRole, nameOf, render, text } from './render';

const labels: SidebarLabels = {
  navigation: 'Kenar çubuğu',
  appName: 'Homelibra',
  capture: 'Not al',
  search: 'Ara',
  overview: 'Genel Bakış',
  sources: 'Kaynaklar',
  index: 'Dizin',
  files: 'Dosyalar',
  settings: 'Ayarlar',
  fileNotes: (name, count) => `${name}, ${count} not`,
  sourceCount: (count) => `Kaynaklar, ${count} kaynak`,
};

const files: SidebarFile[] = [
  { id: 'c1', name: 'İttihat ve Terakki', noteCount: 15 },
  { id: 'c2', name: 'Meşrutiyet basını', noteCount: 4 },
  { id: 'c3', name: 'Yeni dosya', noteCount: 0 },
];

const noop = () => {};

function sidebar(props: Partial<Parameters<typeof Sidebar>[0]> = {}) {
  return render(
    <Sidebar
      shape="full"
      place="overview"
      files={files}
      labels={labels}
      onGo={noop}
      onOpenFile={noop}
      onCapture={noop}
      onSearch={noop}
      {...props}
    />,
  );
}

const selected = (page: ReturnType<typeof render>) =>
  byRole(page, 'tab')
    .filter((tab) => tab.attrs['aria-selected'] === 'true')
    .map(nameOf);

describe('Sidebar', () => {
  it('stacks Not al, Ara, the three places, the Dosyalar and Ayarlar, in that order', () => {
    const page = sidebar();
    expect(byRole(page, 'button').map(nameOf)).toEqual(['Not al']);
    expect(byRole(page, 'tab').map(nameOf)).toEqual([
      'Ara',
      'Genel Bakış',
      'Kaynaklar',
      'Dizin',
      'İttihat ve Terakki, 15 not',
      'Meşrutiyet basını, 4 not',
      'Yeni dosya, 0 not',
      'Ayarlar',
    ]);
    expect(text(page)).toContain('DOSYALAR');
  });

  it('shows the keys of Not al and Ara beside them', () => {
    const [capture] = byRole(sidebar(), 'button');
    const [search] = byRole(sidebar(), 'tab');
    expect(text(capture!)).toBe('Not alN');
    expect(text(search!)).toBe('Ara⌘K');
  });

  it('shows each Collection with its Note count', () => {
    const tabs = byRole(sidebar(), 'tab');
    expect(tabs.slice(4, 7).map(text)).toEqual(['İttihat ve Terakki15', 'Meşrutiyet basını4', 'Yeni dosya0']);
  });

  it('shows the Source count beside Kaynaklar once it is known', () => {
    expect(nameOf(byRole(sidebar(), 'tab')[2]!)).toBe('Kaynaklar');
    const counted = byRole(sidebar({ sourceCount: 9 }), 'tab')[2]!;
    expect(nameOf(counted)).toBe('Kaynaklar, 9 kaynak');
    expect(text(counted)).toBe('Kaynaklar9');
  });

  it('selects the place the scholar is in', () => {
    expect(selected(sidebar({ place: 'overview' }))).toEqual(['Genel Bakış']);
    expect(selected(sidebar({ place: 'search' }))).toEqual(['Ara']);
    expect(selected(sidebar({ place: 'settings' }))).toEqual(['Ayarlar']);
    expect(selected(sidebar({ place: null }))).toEqual([]);
  });

  it('selects the open Collection instead of Dizin', () => {
    expect(selected(sidebar({ place: 'index' }))).toEqual(['Dizin']);
    expect(selected(sidebar({ place: 'index', file: 'c2' }))).toEqual(['Meşrutiyet basını, 4 not']);
  });

  it('as the icon rail, names the same places by icon alone and leaves the Dosyalar out', () => {
    const full = sidebar();
    expect(byRole(full, 'tab').map(nameOf)).toContain('Meşrutiyet basını, 4 not');

    const rail = sidebar({ shape: 'iconRail', sourceCount: 9 });
    expect(byRole(rail, 'button').map(nameOf)).toEqual(['Not al']);
    expect(byRole(rail, 'tab').map(nameOf)).toEqual(['Ara', 'Genel Bakış', 'Kaynaklar', 'Dizin', 'Ayarlar']);
    // Icons only: no word, key or count is drawn.
    expect(text(rail)).toBe('');
    expect(all(rail).some((node) => node.attrs['aria-label'] === 'Homelibra')).toBe(true);
  });

  it('as the icon rail, selects Dizin for the open Collection', () => {
    expect(selected(sidebar({ shape: 'iconRail', place: 'index', file: 'c2' }))).toEqual(['Dizin']);
  });

  it('names its navigation', () => {
    const [list] = byRole(sidebar(), 'tablist');
    expect(nameOf(list!)).toBe('Kenar çubuğu');
    expect(list!.attrs['aria-orientation']).toBe('vertical');
  });
});
