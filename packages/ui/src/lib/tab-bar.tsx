import BookA from 'lucide-react-native/icons/book-a';
import House from 'lucide-react-native/icons/house';
import Library from 'lucide-react-native/icons/library';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { type Colors, radius } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View role="tablist" style={[styles.bar, { paddingBottom: insets.bottom }]}>
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
            style={styles.tab}
          >
            {({ pressed }) => (
              <>
                {pressed && <View style={styles.pressed} />}
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', backgroundColor: c.tabBg, borderTopWidth: 1, borderTopColor: c.line },
    tab: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center', gap: 3 },
    // Inside the tab's cell, so it never spills under the navigation bar.
    pressed: {
      position: 'absolute',
      left: 6,
      right: 6,
      top: 4,
      bottom: 4,
      borderRadius: radius.control,
      backgroundColor: c.accentSoft,
    },
  });
