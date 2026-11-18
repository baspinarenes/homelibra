import type { SidebarPlace } from '@homelibra/ui/sidebar';

/** What the sidebar shows selected: a place, and the Collection open under Dizin. */
export type Selection = { place: SidebarPlace | null; file: string | null };

// The tabs by their first segment. Pages pushed outside the tabs stay with
// the place they belong to: a Tag and a Collection being made with Dizin
// (#181, Q40), a Source, its form and a Note of it with Kaynaklar, the lost
// notes with Genel Bakış that warns of them, the privacy documents with
// Ayarlar that lists them.
const places = new Map<string, SidebarPlace>(
  Object.entries({
    '': 'overview',
    'lost-notes': 'overview',
    sources: 'sources',
    source: 'sources',
    note: 'sources',
    collections: 'index',
    collection: 'index',
    tag: 'index',
    search: 'search',
    settings: 'settings',
    privacy: 'settings',
  }),
);

/** The sidebar's selection for the path the router is on (`usePathname()`). */
export function sidebarPlace(pathname: string): Selection {
  const [first = '', second] = pathname.split('/').filter(Boolean);
  const place = places.get(first) ?? null;
  const file = first === 'collection' && second && second !== 'new' ? second : null;
  return { place, file };
}

/**
 * How the router goes to a place of the sidebar. `dismissTo` closes the pages
 * over the tabs, or over the open tab's root, and lands on the place. The tab
 * navigator does not handle that, so where the tabs are in front another tab
 * is reached by `switchTab` (`router.navigate`).
 */
export function sidebarMove({
  segments,
  place,
  to,
}: {
  /** `useSegments()`: a tab's path starts with its `(tabs)` group. */
  segments: readonly string[];
  /** Where the scholar is, from `sidebarPlace`. */
  place: SidebarPlace | null;
  to: SidebarPlace;
}): 'switchTab' | 'dismissTo' {
  return segments[0] === '(tabs)' && place !== to ? 'switchTab' : 'dismissTo';
}
