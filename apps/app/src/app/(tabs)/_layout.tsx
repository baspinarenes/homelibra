import { TabBar, type TabBarIcon } from '@homelibra/ui/tab-bar';
import { type as typeScale, useTheme } from '@homelibra/ui/theme';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TabIcon } from '@/components/tab-icon';

const tabs = [
  { route: '(home)', key: 'home', icon: 'overview' },
  { route: 'sources', key: 'sources', icon: 'sources' },
  { route: 'collections', key: 'collections', icon: 'index' },
  { route: 'search', key: 'search', icon: 'search' },
  { route: 'settings', key: 'settings', icon: 'settings' },
] as const satisfies readonly { route: string; key: string; icon: TabBarIcon }[];

/**
 * Five tabs: the package's TabBar in the phone tier, a left rail from the
 * rail tier up. Etiketler is not a tab: it is the second view inside Dizin.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  // The wide tier keeps the rail until the sidebar replaces it.
  const rail = useWideLayout().tier !== 'phone';
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={
        rail
          ? undefined
          : ({ state, emitter, navigateToTab }) => {
              const open = state.routes[state.index];
              return (
                <TabBar
                  tabs={tabs.map(({ key, icon }) => ({ key, icon, label: t(`tabs.${key}`) }))}
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
