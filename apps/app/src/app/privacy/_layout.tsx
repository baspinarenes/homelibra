import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useHeaderOptions } from '@/components/tab-stack';

/**
 * Hesap ve gizlilik's documents, open signed in or not: the web page that
 * needs no sign-in (#40, story 15), and the full texts Ayarlar and the
 * first-sign-in screen link to.
 */
export default function PrivacyStack() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useHeaderOptions()}>
      <Stack.Screen name="index" options={{ title: t('privacy.title') }} />
      <Stack.Screen name="notice" options={{ title: t('privacy.notice') }} />
      <Stack.Screen name="terms" options={{ title: t('privacy.terms') }} />
    </Stack>
  );
}
