import { useTheme } from '@homelibra/ui/theme';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useHeaderOptions } from '@/components/tab-stack';
import { SignInIntro } from '@/features/account/sign-in-intro';

// E-posta ile giriş opened by a link still has the first screen to go back to.
export const unstable_settings = { initialRouteName: 'index' };

/**
 * Giriş: the first screen offers e-mail or Google; e-mail opens its own
 * screen, where the code is typed below the address. On a wide screen both
 * are the right-hand column of Giriş 4, beside the same intro (#184); the
 * e-mail screen then draws its own way back, in the column, for the header
 * would be a band of page across its white.
 */
export default function SignInStack() {
  const { t } = useTranslation();
  const wide = useWideLayout().tier === 'wide';
  const { colors } = useTheme();
  const paper = useHeaderOptions();
  const options = wide ? { ...paper, contentStyle: { backgroundColor: colors.surface } } : paper;
  return (
    <View className={wide ? 'flex-1 flex-row bg-page' : 'flex-1'}>
      {/* The Stack keeps its place in both tiers, so a resize across them keeps the typed address and code. */}
      {wide ? <SignInIntro /> : null}
      <View className={wide ? 'w-[440px] border-l border-line bg-surface' : 'flex-1'}>
        <Stack screenOptions={options}>
          <Stack.Screen name="index" options={{ headerShown: false, title: t('signIn.title') }} />
          {/* The header holds only the back arrow; the screen sets its title large, in the page. */}
          <Stack.Screen
            name="email"
            options={{ title: t('signIn.emailTitle'), headerTitle: () => null, headerShown: !wide }}
          />
        </Stack>
      </View>
    </View>
  );
}
