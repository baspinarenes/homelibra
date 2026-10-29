import { Platform } from 'react-native';

/**
 * Where the API lives. In production the web app and the API share one
 * origin (`/api/*`). In development set EXPO_PUBLIC_API_URL; the fallback for
 * the Android emulator is the host machine's port 3000.
 */
export const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? window.location.origin : 'http://10.0.2.2:3000');
