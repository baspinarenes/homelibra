import { describe, expect, it } from 'vitest';

import { sidebarPlace } from '@/components/sidebar-place';

describe('sidebarPlace', () => {
  it('selects the tab the scholar is in, and its pushed pages', () => {
    expect(sidebarPlace('/')).toEqual({ place: 'overview', file: null });
    expect(sidebarPlace('/sources')).toEqual({ place: 'sources', file: null });
    expect(sidebarPlace('/collections')).toEqual({ place: 'index', file: null });
    expect(sidebarPlace('/search')).toEqual({ place: 'search', file: null });
    expect(sidebarPlace('/settings')).toEqual({ place: 'settings', file: null });
    expect(sidebarPlace('/settings/export')).toEqual({ place: 'settings', file: null });
  });

  it('selects the open Collection under Dizin', () => {
    expect(sidebarPlace('/collection/c7')).toEqual({ place: 'index', file: 'c7' });
  });

  it('keeps Dizin for a Tag page and a Collection being made', () => {
    expect(sidebarPlace('/tag/t3')).toEqual({ place: 'index', file: null });
    expect(sidebarPlace('/collection/new')).toEqual({ place: 'index', file: null });
  });

  it('keeps Kaynaklar for a Source, its form and a Note of it', () => {
    expect(sidebarPlace('/source/s2')).toEqual({ place: 'sources', file: null });
    expect(sidebarPlace('/source/s2/edit')).toEqual({ place: 'sources', file: null });
    expect(sidebarPlace('/source/new')).toEqual({ place: 'sources', file: null });
    expect(sidebarPlace('/note/n9')).toEqual({ place: 'sources', file: null });
  });

  it('keeps Genel Bakış for the lost notes it warns of, and Ayarlar for the privacy documents', () => {
    expect(sidebarPlace('/lost-notes')).toEqual({ place: 'overview', file: null });
    expect(sidebarPlace('/privacy/notice')).toEqual({ place: 'settings', file: null });
  });

  it('selects nothing elsewhere', () => {
    expect(sidebarPlace('/somewhere')).toEqual({ place: null, file: null });
  });
});
