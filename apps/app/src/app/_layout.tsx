import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { authClient } from '@/lib/auth-client';
import { queryClient, TRPCProvider, trpcClient } from '@/lib/trpc';
import { colors } from '@/theme';

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <StatusBar style="dark" />
          {isPending ? (
            <View style={styles.splash}>
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
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page },
});
