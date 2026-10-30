import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { tr } from '@/i18n/tr';

import { fonts, useTheme } from '@/theme';

export type TabTitleKey = `tabs.${keyof typeof tr.tabs}`;

/**
 * Each tab is its own stack, so it keeps its own back history. Tapping the
 * tab that is already open pops its stack to the root.
 */
export function TabStack({ title, headerRight }: { title: TabTitleKey; headerRight?: () => ReactNode }) {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useHeaderOptions()}>
      <Stack.Screen name="index" options={{ title: t(title), headerRight }} />
    </Stack>
  );
}

/** The paper header every stack screen uses, in a tab or pushed over the tabs. */
export function useHeaderOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.page },
    headerShadowVisible: false,
    headerTintColor: colors.fg,
    headerTitleStyle: { fontFamily: fonts.serifMedium, fontSize: 21 },
    contentStyle: { backgroundColor: colors.page },
  };
}
