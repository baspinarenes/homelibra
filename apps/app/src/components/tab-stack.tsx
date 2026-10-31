import { ScreenHeader } from '@homelibra/ui/screen-header';
import { type NativeStackHeaderProps, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { tr } from '@/i18n/tr';

import { SharedUndoBar } from '@/components/undo-bar';
import { fonts, useTheme } from '@/theme';

export type TabTitleKey = `tabs.${keyof typeof tr.tabs}`;

/**
 * Each tab is its own stack, so it keeps its own back history. Tapping the
 * tab that is already open pops its stack to the root. `children` declares
 * the screens the tab pushes over its root. A Geri al offered as the scholar
 * came back to the tab (a Source deleted from its form) shows at its foot.
 */
export function TabStack({
  title,
  headerRight,
  children,
}: {
  title: TabTitleKey;
  headerRight?: () => ReactNode;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.tab}>
      <Stack screenOptions={useHeaderOptions()}>
        {/* The tab root keeps the platform header until its screen moves to the package. */}
        <Stack.Screen name="index" options={{ title: t(title), headerRight, header: undefined }} />
        {children}
      </Stack>
      <View pointerEvents="box-none" style={styles.foot}>
        <SharedUndoBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1 },
  // The bar floats above this zero-height edge.
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});

/** A pushed screen's header from @homelibra/ui, fed by the options the screen sets on its Stack.Screen. */
function PushedHeader({ navigation, route, options, back }: NativeStackHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const text = options.title ?? route.name;
  const title =
    typeof options.headerTitle === 'function'
      ? options.headerTitle({ children: text, tintColor: colors.fg })
      : (options.headerTitle ?? text);
  return (
    <ScreenHeader
      title={title}
      onBack={back ? navigation.goBack : undefined}
      backLabel={t('screenHeader.back')}
      right={options.headerRight?.({ canGoBack: !!back, tintColor: colors.accent })}
    />
  );
}

/** The paper header every stack screen uses, in a tab or pushed over the tabs. */
export function useHeaderOptions() {
  const { colors } = useTheme();
  return {
    header: (props: NativeStackHeaderProps) => <PushedHeader {...props} />,
    headerStyle: { backgroundColor: colors.page },
    headerShadowVisible: false,
    headerTintColor: colors.fg,
    headerTitleStyle: { fontFamily: fonts.serifMedium, fontSize: 21 },
    contentStyle: { backgroundColor: colors.page },
  };
}
