import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHeaderOptions } from '@/components/tab-stack';

/**
 * The privacy documents, open signed in or not: Gizlilik, the web page that
 * needs no sign-in (#40, story 15), and the full texts Ayarlar and the
 * first-sign-in screen link to. No tab bar sits under them, so the stack
 * keeps its screens above the phone's navigation bar: a document's last line
 * (its version) stays in view.
 */
export default function PrivacyStack() {
  const { t } = useTranslation();
  const headerOptions = useHeaderOptions();
  const { bottom } = useSafeAreaInsets();
  return (
    <Stack screenOptions={{ ...headerOptions, contentStyle: [headerOptions.contentStyle, { paddingBottom: bottom }] }}>
      <Stack.Screen name="index" options={{ title: t('privacy.title') }} />
      <Stack.Screen name="notice" options={{ title: t('privacy.notice') }} />
      <Stack.Screen name="terms" options={{ title: t('privacy.terms') }} />
    </Stack>
  );
}
