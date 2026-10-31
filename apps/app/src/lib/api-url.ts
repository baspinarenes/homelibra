import { Platform } from 'react-native';

/**
 * Where the API lives. In production the web app and the API share one
 * origin (`/api/*`). In development the native fallback is the phone's own
 * localhost:3000, which `pnpm dev` reverses onto the host machine over adb.
 */
export const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? window.location.origin : 'http://localhost:3000');
