import type { AppRouter } from '@homelibra/api';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { AppState, Platform } from 'react-native';

import { apiUrl } from './api-url';
import { authClient } from './auth-client';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export const queryClient = new QueryClient();

// Native has no window focus, so a query that failed (API unreachable at
// launch, say) would stay failed. Coming back to the app counts as focus and
// refetches it, as returning to the tab does on web.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
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
