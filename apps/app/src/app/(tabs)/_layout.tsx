import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, useWindowDimensions } from 'react-native';

import { TabIcon, type TabIconName } from '@/components/tab-icon';
import { colors } from '@/theme';

// Same breakpoint as the library-nav prototype: below it, a bottom bar.
const RAIL_MIN_WIDTH = 720;

const tabs: { route: string; icon: TabIconName }[] = [
  { route: '(home)', icon: 'home' },
  { route: 'sources', icon: 'sources' },
  { route: 'tags', icon: 'tags' },
  { route: 'collections', icon: 'collections' },
  { route: 'search', icon: 'search' },
];

/** Five tabs: a bottom bar on the phone, a left rail on desktop web. */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const rail = Platform.OS === 'web' && width >= RAIL_MIN_WIDTH;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: rail ? 'left' : 'bottom',
        tabBarVariant: rail ? 'material' : 'uikit',
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderColor: colors.line },
      }}
    >
      {tabs.map(({ route, icon }) => (
        <Tabs.Screen
          key={route}
          name={route}
          options={{
            title: t(`tabs.${icon}`),
            tabBarIcon: ({ color }) => <TabIcon name={icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
