import type { AppRouter } from '@homelibra/api';
import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { Platform } from 'react-native';

import { apiUrl } from './api-url';
import { authClient } from './auth-client';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export const queryClient = new QueryClient();

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
