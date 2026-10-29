import { Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { tr } from '@/i18n/tr';

import { colors } from '@/theme';

export type TabTitleKey = `tabs.${keyof typeof tr.tabs}`;

/**
 * Each tab is its own stack, so it keeps its own back history. Tapping the
 * tab that is already open pops its stack to the root.
 */
export function TabStack({ title, headerRight }: { title: TabTitleKey; headerRight?: () => ReactNode }) {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.fg,
        contentStyle: { backgroundColor: colors.page },
      }}
    >
      <Stack.Screen name="index" options={{ title: t(title), headerRight }} />
    </Stack>
  );
}
