import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, useWindowDimensions } from 'react-native';

import { TabIcon, type TabIconName } from '@/components/tab-icon';
import { type as typeScale, useTheme, wideMinWidth } from '@/theme';

const tabs: { route: string; icon: TabIconName }[] = [
  { route: '(home)', icon: 'home' },
  { route: 'sources', icon: 'sources' },
  { route: 'collections', icon: 'collections' },
  { route: 'search', icon: 'search' },
  { route: 'settings', icon: 'settings' },
];

/**
 * Five tabs: a bottom bar on the phone, a left rail on desktop web. Etiketler
 * is not a tab: it is the second view inside Dosyalar.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const rail = Platform.OS === 'web' && width >= wideMinWidth; // below it, a bottom bar (library-nav prototype)
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: rail ? 'left' : 'bottom',
        tabBarVariant: rail ? 'material' : 'uikit',
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: typeScale.tab,
        tabBarStyle: { backgroundColor: colors.tabBg, borderColor: colors.line },
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
