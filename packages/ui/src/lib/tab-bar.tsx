import BookA from 'lucide-react-native/icons/book-a';
import House from 'lucide-react-native/icons/house';
import Library from 'lucide-react-native/icons/library';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { useTheme } from './use-theme';

// Lucide line icons; one import per icon keeps the bundle small.
const icons = { overview: House, sources: Library, index: BookA, search: Search, settings: Settings } as const;

export type TabBarIcon = keyof typeof icons;

export type TabBarTab = {
  key: string;
  label: string;
  icon: TabBarIcon;
};

/**
 * The bottom bar of the five tabs, above the phone's navigation bar. Each tab
 * takes an equal share of the width.
 */
export function TabBar({
  tabs,
  active,
  onPress,
}: {
  tabs: readonly TabBarTab[];
  /** The key of the open tab. */
  active: string;
  onPress: (key: string) => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View role="tablist" className="flex-row border-t border-line bg-tab-bg" style={{ paddingBottom: insets.bottom }}>
      {tabs.map((tab) => {
        const open = tab.key === active;
        const Icon = icons[tab.icon];
        const color = open ? 'accent' : 'muted';
        return (
          <Pressable
            key={tab.key}
            role="tab"
            aria-selected={open}
            aria-label={tab.label}
            onPress={() => onPress(tab.key)}
            className="h-15 flex-1 items-center justify-center gap-0.75"
          >
            {({ pressed }) => (
              <>
                {/* Inside the tab's cell, so it never spills under the navigation bar. */}
                {pressed && (
                  <View className="absolute top-1 right-1.5 bottom-1 left-1.5 rounded-control bg-accent-soft" />
                )}
                <Icon color={colors[color]} size={22} strokeWidth={1.6} />
                <Text variant="tab" color={color} numberOfLines={1}>
                  {tab.label}
                </Text>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
