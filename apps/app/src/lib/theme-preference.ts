import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** The Sistem / Açık / Koyu choice in Ayarlar. */
export type ThemePreference = 'system' | 'light' | 'dark';

const key = 'homelibra.theme';

const isPreference = (value: string | null): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

/**
 * The choice is kept on this device only. SecureStore does nothing on web, so
 * web keeps it in localStorage. Read synchronously at startup, so the first
 * frame already has the right theme.
 */
export function loadThemePreference(): ThemePreference {
  try {
    const value = Platform.OS === 'web' ? window.localStorage.getItem(key) : SecureStore.getItem(key);
    return isPreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(value: ThemePreference) {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(key, value);
    else void SecureStore.setItemAsync(key, value).catch(() => {});
  } catch {
    // A choice that cannot be stored still applies until the app restarts.
  }
}
