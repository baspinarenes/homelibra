import { TabBar, type TabBarIcon } from '@homelibra/ui/tab-bar';
import { type as typeScale, useTheme, wideMinWidth } from '@homelibra/ui/theme';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, useWindowDimensions } from 'react-native';

import { TabIcon } from '@/components/tab-icon';
import { useToOrganize } from '@/components/to-organize';

const tabs = [
  { route: '(home)', key: 'home', icon: 'overview' },
  { route: 'sources', key: 'sources', icon: 'sources' },
  { route: 'collections', key: 'collections', icon: 'index' },
  { route: 'search', key: 'search', icon: 'search' },
  { route: 'settings', key: 'settings', icon: 'settings' },
] as const satisfies readonly { route: string; key: string; icon: TabBarIcon }[];

/**
 * Five tabs: the package's TabBar on the phone, a left rail on desktop web.
 * Etiketler is not a tab: it is the second view inside Dizin.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const rail = Platform.OS === 'web' && width >= wideMinWidth; // below it, a bottom bar (library-nav prototype)
  const { colors } = useTheme();
  // Genel bakış's dot: Düzenlenecekler holds at least one Source.
  const toOrganize = (useToOrganize().data?.length ?? 0) > 0;

  return (
    <Tabs
      tabBar={
        rail
          ? undefined
          : ({ state, emitter, navigateToTab }) => {
              const open = state.routes[state.index];
              return (
                <TabBar
                  tabs={tabs.map(({ key, icon }) => ({
                    key,
                    icon,
                    label: t(`tabs.${key}`),
                    dot: key === 'home' && toOrganize ? t('tabBar.homeToOrganize') : undefined,
                  }))}
                  active={tabs.find((tab) => tab.route === open?.name)?.key ?? ''}
                  onPress={(key) => {
                    const route = state.routes.find((r) => r.name === tabs.find((tab) => tab.key === key)?.route);
                    if (!route) return;
                    // As the default bar does: the open tab, pressed again, pops its stack to the root.
                    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (route.key !== open?.key && !event.defaultPrevented) navigateToTab(route.key);
                  }}
                />
              );
            }
      }
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
      {tabs.map(({ route, key }) => (
        <Tabs.Screen
          key={route}
          name={route}
          options={{
            title: t(`tabs.${key}`),
            tabBarIcon: ({ color }) => <TabIcon name={key} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
