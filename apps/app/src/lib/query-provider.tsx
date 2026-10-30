import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { queryClient } from './trpc';

// The web works online only: its query cache lives for the tab. The phone
// keeps part of it between launches (query-provider.native.tsx).

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/** Signing out: nothing of the Library stays behind. */
export async function forgetQueries() {
  queryClient.clear();
}
