import { Platform } from 'react-native';

/**
 * Where the API lives. In production the web app and the API share one
 * origin (`/api/*`), which release builds (EAS `preview` and `production`)
 * call too. In development the fallback is localhost:3000: on the phone
 * `pnpm dev` reverses it onto the host machine over adb, and on the web it
 * is the API beside Metro, whose own origin answers `/api/*` with the app's
 * index.html. `EXPO_PUBLIC_API_URL` overrides both.
 */
export const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://localhost:3000' : Platform.OS === 'web' ? window.location.origin : 'https://homelibra.com');
