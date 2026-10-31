import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useHeaderOptions } from '@/components/tab-stack';

// E-posta ile giriş opened by a link still has the first screen to go back to.
export const unstable_settings = { initialRouteName: 'index' };

/**
 * Giriş: the first screen offers e-mail or Google; e-mail opens its own
 * screen, where the code is typed below the address.
 */
export default function SignInStack() {
  const { t } = useTranslation();
  return (
    <Stack screenOptions={useHeaderOptions()}>
      <Stack.Screen name="index" options={{ headerShown: false, title: t('signIn.title') }} />
      {/* The header holds only the back arrow; the screen sets its title large, in the page. */}
      <Stack.Screen name="email" options={{ title: t('signIn.emailTitle'), headerTitle: () => null }} />
    </Stack>
  );
}
