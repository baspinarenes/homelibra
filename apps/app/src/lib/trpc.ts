import type { AppRouter } from '@homelibra/api';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext, createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { addNetworkStateListener, getNetworkStateAsync } from 'expo-network';
import { AppState, Platform } from 'react-native';

import { apiUrl } from './api-url';
import { authClient } from './auth-client';
import { isOffline } from './network';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export const queryClient = new QueryClient({
  defaultOptions: {
    // A save offline fails and says so, as before, rather than waiting
    // unseen for the network. Capture goes through the outbox instead.
    mutations: { networkMode: 'always' },
  },
});

if (Platform.OS !== 'web') {
  // Native has no window focus, so a query that failed (API unreachable at
  // launch, say) would stay failed. Coming back to the app counts as focus and
  // refetches it, as returning to the tab does on web.
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => subscription.remove();
  });
  // Nor has it the browser's online events. Offline, a query keeps what the
  // cache holds and waits for the network instead of failing.
  onlineManager.setEventListener((setOnline) => {
    const subscription = addNetworkStateListener((state) => setOnline(!isOffline(state)));
    void getNetworkStateAsync().then((state) => setOnline(!isOffline(state)));
    return () => subscription.remove();
  });
}

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
      // Web sends the httpOnly session cookie itself; native reads the
      // session from SecureStore and passes it as a header.
      fetch: (url, options) => fetch(url, { ...options, credentials: Platform.OS === 'web' ? 'include' : 'omit' }),
      headers: async () => {
        if (Platform.OS === 'web') return {};
        const cookie = await authClient.getCookie();
        return cookie ? { cookie } : {};
      },
    }),
  ],
});

/** Query keys and options outside React, for code that is not a component (the outbox). */
export const trpcOptions = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });
