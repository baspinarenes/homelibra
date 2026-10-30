import '@/lib/sentry';
import '@/i18n';

import { CharisSIL_400Regular } from '@expo-google-fonts/charis-sil';
import { EBGaramond_400Regular, EBGaramond_500Medium } from '@expo-google-fonts/eb-garamond';
import { RedditMono_500Medium } from '@expo-google-fonts/reddit-mono';
import { RedditSans_400Regular, RedditSans_500Medium, RedditSans_600SemiBold } from '@expo-google-fonts/reddit-sans';
import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useHeaderOptions } from '@/components/tab-stack';
import { authClient } from '@/lib/auth-client';
import { queryClient, TRPCProvider, trpcClient } from '@/lib/trpc';
import { useTheme } from '@/theme';

export default Sentry.wrap(RootLayout);

function RootLayout() {
  const { data: session, isPending, isRefetching } = authClient.useSession();
  const { scheme, colors } = useTheme();
  // Pushed over the tabs (the Source page and form, note editing), so they keep a back button.
  const pushedScreen = { ...useHeaderOptions(), headerShown: true };
  // Keys must match `fonts` in theme.ts. A font that fails to load falls back to the system font.
  const [fontsLoaded, fontError] = useFonts({
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    CharisSIL_400Regular,
    RedditSans_400Regular,
    RedditSans_500Medium,
    RedditSans_600SemiBold,
    RedditMono_500Medium,
  });
  // Better Auth refetches the session on window focus and, while signed out,
  // marks that refetch pending too. Showing the splash then would unmount the
  // sign-in screen and lose its step, typed code and ?error= message.
  const loading = (isPending && !isRefetching) || (!fontsLoaded && !fontError);
  const termsAccepted = !!session?.user.termsAcceptedAt;
  const closed = !!session?.user.deletionRequestedAt;
  // Where a screen the session no longer opens sends the scholar. Said
  // outright: Expo Router's own fallback is the shortest route name.
  const home = !session ? '/sign-in' : closed ? '/account-closed' : !termsAccepted ? '/welcome' : '/';

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {/* Follows the app's theme, which Ayarlar can pin away from the system's. */}
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {loading ? (
            <View style={[styles.splash, { backgroundColor: colors.page }]}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
              <Stack.Protected guard={!!session && termsAccepted && !closed} redirectTo={home}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="source/new" options={pushedScreen} />
                <Stack.Screen name="source/[id]/index" options={pushedScreen} />
                <Stack.Screen name="source/[id]/edit" options={pushedScreen} />
                <Stack.Screen name="note/[id]" options={pushedScreen} />
              </Stack.Protected>
              {/* İlk giriş onayı: the Library stays closed until the terms of use are accepted. */}
              <Stack.Protected guard={!!session && !termsAccepted && !closed} redirectTo={home}>
                <Stack.Screen name="welcome" />
              </Stack.Protected>
              {/* Hesabı sil was confirmed: only "Silmeyi iptal et" until the Account is deleted. */}
              <Stack.Protected guard={!!session && closed} redirectTo={home}>
                <Stack.Screen name="account-closed" />
              </Stack.Protected>
              <Stack.Protected guard={!session} redirectTo={home}>
                <Stack.Screen name="sign-in" />
              </Stack.Protected>
              {/* Hesap ve gizlilik's documents open signed in or not. */}
              <Stack.Screen name="privacy" />
            </Stack>
          )}
        </TRPCProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
