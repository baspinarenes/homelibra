import BookA from 'lucide-react-native/icons/book-a';
import House from 'lucide-react-native/icons/house';
import Library from 'lucide-react-native/icons/library';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

// Lucide line icons; one import per icon keeps the bundle small.
const icons = { overview: House, sources: Library, index: BookA, search: Search, settings: Settings } as const;

export type TabBarIcon = keyof typeof icons;

export type TabBarTab = {
  key: string;
  label: string;
  icon: TabBarIcon;
  /**
   * When set, a dot marks the tab and screen readers hear this instead of
   * the label. Hidden while the tab is open.
   */
  dot?: string;
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
        const color = open ? colors.accent : colors.muted;
        const dot = open ? undefined : tab.dot;
        return (
          <Pressable
            key={tab.key}
            role="tab"
            aria-selected={open}
            aria-label={dot ?? tab.label}
            onPress={() => onPress(tab.key)}
            style={styles.tab}
          >
            {({ pressed }) => (
              <>
                {pressed && <View style={styles.pressed} />}
                <View>
                  <Icon color={color} size={22} strokeWidth={1.6} />
                  {dot !== undefined && <View style={styles.dot} />}
                </View>
                <Text style={[styles.label, { color }]} numberOfLines={1}>
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
    // Top right of the icon, ringed in the page colour.
    dot: {
      position: 'absolute',
      top: -1 - 2,
      right: -4 - 2,
      width: 7 + 4,
      height: 7 + 4,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: c.page,
      backgroundColor: c.accent,
    },
    label: { ...typeScale.tab },
  });
