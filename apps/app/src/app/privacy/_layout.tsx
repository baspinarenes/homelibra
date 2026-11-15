import { AppLogo } from '@homelibra/ui/logo';
import { Text } from '@homelibra/ui/text';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHeaderOptions } from '@/components/tab-stack';
import { useFrameSidebar } from '@/components/wide-frame';

/**
 * The privacy documents, open signed in or not: Gizlilik, the web page that
 * needs no sign-in (#40, story 15), and the full texts Ayarlar and the
 * first-sign-in screen link to. No tab bar sits under them, so the stack
 * keeps its screens above the phone's navigation bar: a document's last line
 * (its version) stays in view. On a wide screen each is a reading column
 * with no header, its way back above the column's left (#185); where no
 * sidebar stands beside it (the Library closed), the logo heads the page.
 */
export default function PrivacyStack() {
  const { t } = useTranslation();
  const headerOptions = useHeaderOptions();
  const { bottom } = useSafeAreaInsets();
  const wide = useWideLayout().tier === 'wide';
  const sidebar = useFrameSidebar();
  return (
    <View className="flex-1 bg-page">
      {wide && !sidebar ? (
        <View className="flex-row items-center gap-2.5 px-10 pt-7">
          <AppLogo size={24} label={t('wideSidebar.appName')} />
          <Text variant="summary" color="fg" aria-hidden>
            {t('wideSidebar.appName')}
          </Text>
        </View>
      ) : null}
      {/* The Stack keeps its place in both tiers, so a resize across them keeps the screen open. */}
      <Stack
        screenOptions={{
          ...headerOptions,
          headerShown: !wide,
          contentStyle: [headerOptions.contentStyle, { paddingBottom: bottom }],
        }}
      >
        <Stack.Screen name="index" options={{ title: t('privacy.title') }} />
        <Stack.Screen name="notice" options={{ title: t('privacy.notice') }} />
        <Stack.Screen name="terms" options={{ title: t('privacy.terms') }} />
      </Stack>
    </View>
  );
}
