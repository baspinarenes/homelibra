import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import Library from 'lucide-react-native/icons/library';
import List from 'lucide-react-native/icons/list';
import Plus from 'lucide-react-native/icons/plus';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import { Pressable, ScrollView, View } from 'react-native';

import { cx } from './cx';
import type { IconComponent } from './icon';
import { AppLogo } from './logo';
import { Text } from './text';
import type { Colors } from './tokens';
import { useTheme } from './use-theme';
import type { Sidebar as SidebarShape } from './wide-layout';

/** The places the sidebar goes to; `index` is Dizin. */
export type SidebarPlace = 'search' | 'overview' | 'sources' | 'index' | 'settings';

/** A Collection under Dosyalar. */
export type SidebarFile = { id: string; name: string; noteCount: number };

/** The sidebar's words, in the app's language. */
export type SidebarLabels = {
  /** What screen readers call the sidebar's list of places. */
  navigation: string;
  /** The logo's name. */
  appName: string;
  capture: string;
  search: string;
  overview: string;
  sources: string;
  index: string;
  files: string;
  settings: string;
  /** A Collection row as a screen reader reads it: its name and Note count. */
  fileNotes: (name: string, count: number) => string;
  /** Kaynaklar with its Source count, as a screen reader reads it. */
  sourceCount: (count: number) => string;
};

const icons = {
  search: Search,
  overview: LayoutGrid,
  sources: Library,
  index: List,
  settings: Settings,
} as const satisfies Record<SidebarPlace, IconComponent>;

/** Under Ara, in this order; Ayarlar stands apart at the foot. */
const places = ['overview', 'sources', 'index'] as const satisfies readonly SidebarPlace[];

type Props = {
  /** `full`: 248 px with words and the Dosyalar; `iconRail`: the same places as 64 px of icons. */
  shape: SidebarShape;
  /** Where the scholar is; null where no place of the sidebar is. */
  place: SidebarPlace | null;
  /** The open Collection: its row is selected in place of Dizin's (the icon rail, which has no rows, keeps Dizin). */
  file?: string | null;
  files: readonly SidebarFile[];
  /** Shown beside Kaynaklar once known. */
  sourceCount?: number;
  labels: SidebarLabels;
  onGo: (place: SidebarPlace) => void;
  onOpenFile: (id: string) => void;
  /** Not al. */
  onCapture: () => void;
  /** Ara ⌘K: the quick search window, as ⌘K opens it. Selected while Ara is the place. */
  onSearch: () => void;
};

/**
 * The wide tier's frame (ADR-0012): Not al first, then Ara ⌘K, Genel Bakış,
 * Kaynaklar, Dizin and every Collection under Dosyalar with its Note count,
 * Ayarlar at the foot. Etiketler are not listed: they stay inside Dizin.
 * As the 64 px icon rail it keeps the places, by icon and name, without the
 * Dosyalar.
 */
export function Sidebar(props: Props) {
  return props.shape === 'iconRail' ? <IconRail {...props} /> : <FullSidebar {...props} />;
}

function FullSidebar({ place, file, files, sourceCount, labels, onGo, onOpenFile, onCapture, onSearch }: Props) {
  const { colors } = useTheme();
  const searching = place === 'search';
  const inFile = place === 'index' && !!file;
  return (
    <View className="h-full w-[248px] gap-xs border-r border-line bg-page px-md py-lg">
      <View className="flex-row items-center gap-2.5 px-1.5 pb-md">
        <AppLogo size={24} label={labels.appName} />
        <Text variant="summary" color="fg" aria-hidden>
          {labels.appName}
        </Text>
      </View>
      <Pressable
        role="button"
        aria-label={labels.capture}
        onPress={onCapture}
        className="flex-row items-center justify-center gap-1.5 rounded-control bg-accent px-2.5 py-2 active:opacity-70"
      >
        <Plus color={colors.accentFg} size={16} strokeWidth={1.8} />
        <Text variant="button" color="accentFg">
          {labels.capture}
        </Text>
        <Text variant="count" color="accentFg" className="ml-1 opacity-75">
          N
        </Text>
      </Pressable>
      <View role="tablist" aria-label={labels.navigation} aria-orientation="vertical" className="flex-1 gap-xs">
        <Pressable
          role="tab"
          aria-selected={searching}
          aria-label={labels.search}
          onPress={onSearch}
          className={cx(
            'mt-1.5 mb-md flex-row items-center gap-2 rounded-control border bg-surface px-2.5 py-1.75 active:opacity-70',
            searching ? 'border-accent' : 'border-line',
          )}
        >
          <Search color={colors[searching ? 'accent' : 'muted']} size={18} strokeWidth={1.6} />
          <Text variant="bodySm" color={searching ? 'accent' : 'muted'}>
            {labels.search}
          </Text>
          <View className="ml-auto rounded-chip border border-line bg-surface px-1.25">
            <Text variant="count" color="ink2">
              ⌘K
            </Text>
          </View>
        </Pressable>
        {places.map((key) => (
          <PlaceRow
            key={key}
            place={key}
            label={labels[key]}
            selected={place === key && !(key === 'index' && inFile)}
            count={key === 'sources' ? sourceCount : undefined}
            countLabel={key === 'sources' && sourceCount !== undefined ? labels.sourceCount(sourceCount) : undefined}
            onPress={() => onGo(key)}
          />
        ))}
        <Text variant="micro" className="pt-2.5 pr-2.5 pb-1 pl-9.5">
          {labels.files}
        </Text>
        <ScrollView className="shrink grow-0" contentContainerClassName="gap-xs">
          {files.map((collection) => {
            const selected = inFile && collection.id === file;
            return (
              <Pressable
                key={collection.id}
                role="tab"
                aria-selected={selected}
                aria-label={labels.fileNotes(collection.name, collection.noteCount)}
                onPress={() => onOpenFile(collection.id)}
                className={cx(
                  'flex-row items-center gap-2 rounded-chip py-1.5 pr-2.5 pl-9.5 active:opacity-70',
                  selected && 'bg-accent-soft',
                )}
              >
                <Text
                  variant={selected ? 'label' : 'bodySm'}
                  color={selected ? 'accent' : 'ink3'}
                  className="min-w-0 flex-1"
                  numberOfLines={1}
                >
                  {collection.name}
                </Text>
                <Text variant="collectionCount" color={selected ? 'accent' : 'muted'}>
                  {collection.noteCount}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View className="flex-1" />
        <PlaceRow
          place="settings"
          label={labels.settings}
          selected={place === 'settings'}
          onPress={() => onGo('settings')}
        />
      </View>
    </View>
  );
}

function PlaceRow({
  place,
  label,
  selected,
  count,
  countLabel,
  onPress,
}: {
  place: SidebarPlace;
  label: string;
  selected: boolean;
  count?: number;
  countLabel?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const Icon = icons[place];
  const ink: keyof Colors = selected ? 'accent' : 'ink3';
  return (
    <Pressable
      role="tab"
      aria-selected={selected}
      aria-label={countLabel ?? label}
      onPress={onPress}
      className={cx(
        'flex-row items-center gap-2.5 rounded-chip px-2.5 py-1.75 active:opacity-70',
        selected && 'bg-accent-soft',
      )}
    >
      <Icon color={colors[ink]} size={18} strokeWidth={1.6} />
      <Text variant="label" color={ink}>
        {label}
      </Text>
      {count !== undefined && (
        <Text variant="collectionCount" className="ml-auto">
          {count}
        </Text>
      )}
    </Pressable>
  );
}

function IconRail({ place, labels, onGo, onCapture, onSearch }: Props) {
  const { colors } = useTheme();
  const rail = ['search', ...places] as const;
  return (
    <View className="h-full w-16 items-center gap-1.5 border-r border-line bg-page py-lg">
      <View className="mb-2">
        <AppLogo size={24} label={labels.appName} />
      </View>
      <Pressable
        role="button"
        aria-label={labels.capture}
        onPress={onCapture}
        className="h-9 w-10 items-center justify-center rounded-control bg-accent active:opacity-70"
      >
        <Plus color={colors.accentFg} size={18} strokeWidth={1.8} />
      </Pressable>
      <View
        role="tablist"
        aria-label={labels.navigation}
        aria-orientation="vertical"
        className="flex-1 items-center gap-1.5"
      >
        {rail.map((key) => (
          <RailIcon
            key={key}
            place={key}
            label={labels[key]}
            selected={place === key}
            onPress={key === 'search' ? onSearch : () => onGo(key)}
          />
        ))}
        <View className="flex-1" />
        <RailIcon
          place="settings"
          label={labels.settings}
          selected={place === 'settings'}
          onPress={() => onGo('settings')}
        />
      </View>
    </View>
  );
}

function RailIcon({
  place,
  label,
  selected,
  onPress,
}: {
  place: SidebarPlace;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const Icon = icons[place];
  return (
    <Pressable
      role="tab"
      aria-selected={selected}
      aria-label={label}
      onPress={onPress}
      className={cx(
        'h-10 w-10 items-center justify-center rounded-control active:opacity-70',
        selected && 'bg-accent-soft',
      )}
    >
      <Icon color={colors[selected ? 'accent' : 'muted']} size={20} strokeWidth={1.6} />
    </Pressable>
  );
}
