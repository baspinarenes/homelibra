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
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.page },
        headerShadowVisible: false,
        headerTintColor: colors.fg,
        headerTitleStyle: { fontFamily: fonts.serifMedium, fontSize: 21 },
        contentStyle: { backgroundColor: colors.page },
      }}
    >
      <Stack.Screen name="index" options={{ title: t(title), headerRight }} />
    </Stack>
  );
}
