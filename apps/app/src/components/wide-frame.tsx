import { Sidebar, type SidebarPlace } from '@homelibra/ui/sidebar';
import {
  HoldShortcuts,
  type Layout,
  type Sidebar as SidebarShape,
  useShortcuts,
  useWideLayout,
} from '@homelibra/ui/wide-layout';
import { useQuery } from '@tanstack/react-query';
import { type Href, useIsFocused, usePathname, useRouter, useSegments } from 'expo-router';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { openPanels, type OpenPanels } from '@/components/open-panels';
import { sidebarMove, sidebarPlace } from '@/components/sidebar-place';
import { useCollections } from '@/features/collection/collection-list';
import { captureAction } from '@/features/note/capture-keys';
import { CapturePanel, useWideCapture } from '@/features/note/wide-capture';
import { QuickSearchWindow } from '@/features/search/quick-search';
import { useTRPC } from '@/lib/trpc';

const Panels = createContext<OpenPanels | null>(null);
const SidebarShown = createContext(false);
// Whether the frame's Not al panel stands beside the screen (#178).
const Capturing = createContext(false);
// The writing of the page in front that writes on its own (a Source page), which takes Not al.
type PageWriting = { current: (() => void) | null };
const PageWritings = createContext<PageWriting | null>(null);
// How many pieces of unsaved work stand in front (an edit in place, a form): Not al waits on them.
const UnsavedWork = createContext<{ current: number } | null>(null);

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
  const router = useRouter();
  const trpc = useTRPC();
  const [panels] = useState(openPanels);
  const screenPanel = useSyncExternalStore(panels.subscribe, panels.isOpen, panels.isOpen);
  // Not al off a Source page (#178): the writing in a panel beside the screen, its draft kept here.
  const [writing, setWriting] = useState(false);
  const [focusAsk, setFocusAsk] = useState(0);
  const capture = useWideCapture();
  const [pageWriting] = useState<PageWriting>(() => ({ current: null }));
  const [unsaved] = useState(() => ({ current: 0 }));
  // A Library closed (signed out) takes its half-written Note with it.
  const [open, setOpen] = useState(library);
  if (open !== library) {
    setOpen(library);
    if (!library) capture.reset();
  }
  const { sidebar } = useWideLayout({ panelOpen: screenPanel || writing });
  // The quick search window (#175): ⌘K from any screen of the open Library, or Ara ⌘K in the sidebar.
  const [searching, setSearching] = useState(false);
  const framed = library && sidebar !== null;
  // Narrowed below the wide tier, or the Library closed, the window and the writing go with the sidebar.
  if (searching && !framed) setSearching(false);
  if (writing && !framed) setWriting(false);
  // A panel is closed on entry: another screen, or a screen's own panel opened, puts the writing away.
  const pathname = usePathname();
  const [path, setPath] = useState(pathname);
  if (path !== pathname) {
    setPath(pathname);
    setWriting(false);
  }
  useEffect(() => panels.subscribe(() => (panels.isOpen() ? setWriting(false) : undefined)), [panels]);

  const home = useQuery({ ...trpc.sources.home.queryOptions(), enabled: framed });
  const openWriting = () => {
    // Work not yet saved in front is never put away unasked: finish or leave it first.
    if (unsaved.current > 0) return;
    // With no Source yet, the first one is made before any Note.
    if (home.data?.sourceCount === 0) {
      router.push('/source/new');
      return;
    }
    if (!writing) void capture.ready();
    setWriting(true);
    setFocusAsk((asked) => asked + 1);
  };
  // The sidebar's Not al: a page writing on its own brings its writing forward.
  const notAl = () => {
    if (unsaved.current > 0) return;
    if (pageWriting.current) pageWriting.current();
    else openWriting();
  };

  useShortcuts({ active: framed }, (command) => {
    if (command !== 'quickSearch') return false;
    setSearching(true);
    return true;
  });
  // N once the page in front has let it go; heard after every screen's own keys.
  useShortcuts({ active: framed && !writing, last: true }, (command) => {
    const state = { writing: false, pageWrites: pageWriting.current !== null, choosing: false, canSave: false };
    if (captureAction(command, state) !== 'open') return false;
    openWriting();
    return true;
  });
  const capturing = framed && writing;
  return (
    <Panels value={panels}>
      <PageWritings value={pageWriting}>
        <UnsavedWork value={unsaved}>
          <SidebarShown value={framed}>
            <Capturing value={capturing}>
              <View className="flex-1 flex-row bg-page">
                {framed && <FrameSidebar shape={sidebar} onSearch={() => setSearching(true)} onCapture={notAl} />}
                {/* While the writing is open the screen's keys are held: they are the panel's. */}
                <HoldShortcuts held={capturing}>
                  <View className="flex-1">{children}</View>
                </HoldShortcuts>
                {capturing && (
                  <View className="w-[520px] border-l border-line">
                    <CapturePanel capture={capture} focusAsk={focusAsk} onClose={() => setWriting(false)} />
                  </View>
                )}
              </View>
            </Capturing>
          </SidebarShown>
        </UnsavedWork>
      </PageWritings>
      {framed && searching && <FrameQuickSearch onClose={() => setSearching(false)} />}
    </Panels>
  );
}

/** A screen's layout in the frame: the tier and `density` for its rows, and whether Not al's panel stands beside it. */
export type FrameLayout = Layout & { capturing: boolean };

/**
 * How a screen tells the frame its panel is open beside its list. Reported
 * only while the screen is in front: a screen under a pushed one, or in a
 * tab not shown, leaves the sidebar as it is. Opening its panel puts the
 * frame's Not al away; Not al opening calls `onCapture`, where the screen
 * closes its own panel, so only one ever stands beside the list (#178).
 * Returns the screen's layout with its panel or Not al's: the tier,
 * `density` for its rows, and `capturing`, while Not al's panel stands
 * beside it (its list then fills its place: PanelLayout `beside`).
 */
export function useFramePanel(open: boolean, onCapture?: () => void): FrameLayout {
  const panels = useContext(Panels);
  const focused = useIsFocused();
  const capturing = useContext(Capturing) && focused;
  // Before the paint, so Not al's panel and the screen's never stand side by side.
  useLayoutEffect(() => (open && focused && panels ? panels.open() : undefined), [open, focused, panels]);
  const [wasCapturing, setWasCapturing] = useState(capturing);
  if (capturing !== wasCapturing) {
    setWasCapturing(capturing);
    if (capturing) onCapture?.();
  }
  return { ...useWideLayout({ panelOpen: open || capturing }), capturing };
}

/**
 * A page with its own writing (a wide Source page, #177) takes Not al
 * while it is in front: the sidebar's Not al calls `toWriting`, and N is
 * left to the page, never opening the frame's panel over it.
 */
export function usePageWriting(toWriting: () => void): void {
  const writings = useContext(PageWritings);
  const focused = useIsFocused();
  const latest = useRef(toWriting);
  latest.current = toWriting;
  useEffect(() => {
    if (!focused || !writings) return;
    const take = () => latest.current();
    writings.current = take;
    return () => {
      if (writings.current === take) writings.current = null;
    };
  }, [focused, writings]);
}

/**
 * Work not yet saved (a Note edited in place with changes, a form being
 * filled) holds Not al while `changed`: neither N nor the sidebar's Not al
 * puts it away unasked (#178).
 */
export function useUnsavedWork(changed: boolean): void {
  const unsaved = useContext(UnsavedWork);
  const focused = useIsFocused();
  const held = changed && focused;
  useEffect(() => {
    if (!held || !unsaved) return;
    unsaved.current += 1;
    return () => {
      unsaved.current -= 1;
    };
  }, [held, unsaved]);
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

function FrameSidebar({
  shape,
  onSearch,
  onCapture,
}: {
  shape: SidebarShape;
  onSearch: () => void;
  onCapture: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const trpc = useTRPC();
  const { place, file } = sidebarPlace(usePathname());
  const segments = useSegments();
  // Dosyalar in Son değişen order, the Collections last written in first.
  const collections = useCollections('recent');
  const home = useQuery(trpc.sources.home.queryOptions());

  const go = (to: SidebarPlace) => {
    if (sidebarMove({ segments, place, to }) === 'switchTab') router.navigate(tabHref[to]);
    else router.dismissTo(tabHref[to]);
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
      onCapture={onCapture}
      onSearch={onSearch}
    />
  );
}
