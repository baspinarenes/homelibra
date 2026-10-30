import '@/i18n';

import { CharisSIL_400Regular } from '@expo-google-fonts/charis-sil';
import { EBGaramond_400Regular, EBGaramond_500Medium } from '@expo-google-fonts/eb-garamond';
import { RedditMono_500Medium } from '@expo-google-fonts/reddit-mono';
import { RedditSans_400Regular, RedditSans_500Medium, RedditSans_600SemiBold } from '@expo-google-fonts/reddit-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { authClient } from '@/lib/auth-client';
import { queryClient, TRPCProvider, trpcClient } from '@/lib/trpc';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { colors } = useTheme();
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
  const loading = isPending || (!fontsLoaded && !fontError);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <StatusBar style="auto" />
          {loading ? (
            <View style={[styles.splash, { backgroundColor: colors.page }]}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
              <Stack.Protected guard={!!session}>
                <Stack.Screen name="(tabs)" />
              </Stack.Protected>
              <Stack.Protected guard={!session}>
                <Stack.Screen name="sign-in" />
              </Stack.Protected>
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
