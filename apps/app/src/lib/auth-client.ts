import { expoClient } from '@better-auth/expo/client';
import type { Auth } from '@homelibra/api';
import { emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { apiUrl } from './api-url';

/**
 * Better Auth in the app. On native, expoClient keeps the session in
 * SecureStore; on web it steps aside and the browser holds the httpOnly
 * session cookie. The session's user carries the API's extra Account
 * fields, such as when the terms of use were accepted.
 */
export const authClient = createAuthClient({
  baseURL: apiUrl,
  basePath: '/api/auth',
  plugins: [
    emailOTPClient(),
    inferAdditionalFields<Auth>(),
    expoClient({ scheme: 'homelibra', storagePrefix: 'homelibra', storage: SecureStore }),
  ],
});
