import { Sidebar, type SidebarPlace } from '@homelibra/ui/sidebar';
import { type Layout, type Sidebar as SidebarShape, useShortcuts, useWideLayout } from '@homelibra/ui/wide-layout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href, useIsFocused, usePathname, useRouter, useSegments } from 'expo-router';
import { createContext, type ReactNode, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { openPanels, type OpenPanels } from '@/components/open-panels';
import { sidebarMove, sidebarPlace } from '@/components/sidebar-place';
import { useCollections } from '@/features/collection/collection-list';
import { QuickSearchWindow } from '@/features/search/quick-search';
import { useTRPC } from '@/lib/trpc';

const Panels = createContext<OpenPanels | null>(null);
const SidebarShown = createContext(false);

/**
 * The frame around every screen of the open Library (ADR-0012): in the wide
 * tier the sidebar stands left of the root Stack, so the tabs and the pages
 * pushed over them (Collection, Tag, Source, lost notes, the privacy
 * documents) all have it. `library` is false where the Library is closed
 * (sign-in, Hoş geldin, Kapalı hesap): no sidebar there. It narrows to the
 * icon rail while the screen in front has its panel open below 1200 px
 * (`useFramePanel`). The Stack keeps its place in every state, so crossing
 * a tier never remounts the screens.
 */
export function WideFrame({ library, children }: { library: boolean; children: ReactNode }) {
  const [panels] = useState(openPanels);
  const panelOpen = useSyncExternalStore(panels.subscribe, panels.isOpen, panels.isOpen);
  const { sidebar } = useWideLayout({ panelOpen });
  // The quick search window (#175): ⌘K from any screen of the open Library, or Ara ⌘K in the sidebar.
  const [searching, setSearching] = useState(false);
  const framed = library && sidebar !== null;
  // Narrowed below the wide tier, or the Library closed, the window goes with the sidebar.
  if (searching && !framed) setSearching(false);
  useShortcuts({ active: framed }, (command) => {
    if (command !== 'quickSearch') return false;
    setSearching(true);
    return true;
  });
  return (
    <Panels value={panels}>
      <SidebarShown value={framed}>
        <View className="flex-1 flex-row bg-page">
          {framed && <FrameSidebar shape={sidebar} onSearch={() => setSearching(true)} />}
          <View className="flex-1">{children}</View>
        </View>
      </SidebarShown>
      {framed && searching && <FrameQuickSearch onClose={() => setSearching(false)} />}
    </Panels>
  );
}

/**
 * How a screen tells the frame its panel is open beside its list. Reported
 * only while the screen is in front: a screen under a pushed one, or in a
 * tab not shown, leaves the sidebar as it is. Returns the screen's layout
 * with its panel: the tier, and `density` for its rows.
 */
export function useFramePanel(open: boolean): Layout {
  const panels = useContext(Panels);
  const focused = useIsFocused();
  useEffect(() => (open && focused && panels ? panels.open() : undefined), [open, focused, panels]);
  return useWideLayout({ panelOpen: open });
}

/**
 * Whether the frame draws the sidebar beside the screen: in the wide tier
 * with the Library open. A screen open with the Library closed too (the
 * privacy documents) shows the logo in its place.
 */
export function useFrameSidebar(): boolean {
  return useContext(SidebarShown);
}

const tabHref = {
  search: '/search',
  overview: '/',
  sources: '/sources',
  index: '/collections',
  settings: '/settings',
} as const satisfies Record<SidebarPlace, Href>;

/** The quick search window; "Ara'da tüm sonuçlar" opens Ara with the query, as the sidebar goes to a place. */
function FrameQuickSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { place } = sidebarPlace(usePathname());
  const segments = useSegments();
  return (
    <QuickSearchWindow
      onClose={onClose}
      onSearchAll={(query) => {
        const params = query === '' ? undefined : { q: query };
        // On Ara already, the box takes the query in place.
        if (place === 'search') router.setParams({ q: params?.q });
        else if (sidebarMove({ segments, place, to: 'search' }) === 'switchTab')
          router.navigate({ pathname: '/search', params });
        else router.dismissTo({ pathname: '/search', params });
      }}
    />
  );
}

function FrameSidebar({ shape, onSearch }: { shape: SidebarShape; onSearch: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { place, file } = sidebarPlace(usePathname());
  const segments = useSegments();
  // Dosyalar in Son değişen order, the Collections last written in first.
  const collections = useCollections('recent');
  const home = useQuery(trpc.sources.home.queryOptions());

  const go = (to: SidebarPlace) => {
    if (sidebarMove({ segments, place, to }) === 'switchTab') router.navigate(tabHref[to]);
    else router.dismissTo(tabHref[to]);
  };

  // Today's way to take a Note (#178 gives Not al its own panel): the last
  // noted Source, ready to write, as Kaldığın yer opens it; with no Note yet,
  // Kaynaklar to pick a Source, or the form for the first one.
  const capture = async () => {
    const last = await queryClient.fetchQuery(trpc.sources.lastNoted.queryOptions()).catch(() => null);
    if (last) router.push({ pathname: '/source/[id]', params: { id: last.source.id, write: '1' } });
    else if (home.data?.sourceCount === 0) router.push('/source/new');
    else go('sources');
  };

  return (
    <Sidebar
      shape={shape}
      place={place}
      file={file}
      files={collections.data ?? []}
      sourceCount={home.data?.sourceCount}
      labels={{
        navigation: t('wideSidebar.navigation'),
        appName: t('wideSidebar.appName'),
        capture: t('wideSidebar.capture'),
        search: t('tabs.search'),
        overview: t('tabs.home'),
        sources: t('tabs.sources'),
        index: t('tabs.collections'),
        files: t('wideSidebar.files'),
        settings: t('tabs.settings'),
        fileNotes: (name, count) => t('wideSidebar.fileNotes', { name, count }),
        sourceCount: (count) => t('wideSidebar.sourceCount', { count }),
      }}
      onGo={go}
      onOpenFile={(id) => {
        if (id === file) return;
        const href = { pathname: '/collection/[id]', params: { id } } as const;
        // One Collection in place of another, so going from file to file does not pile them up.
        if (file) router.replace(href);
        else router.push(href);
      }}
      onCapture={() => void capture()}
      onSearch={onSearch}
    />
  );
}
