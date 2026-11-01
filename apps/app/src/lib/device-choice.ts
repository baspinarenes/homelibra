import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * A choice kept on this device only (the theme, Dizin's orders). SecureStore
 * does nothing on web, so web keeps it in localStorage. Read synchronously, so
 * the first frame already shows it. Anything stored that is not one of
 * `allowed`, or nothing, reads as the first of them.
 */
export function loadDeviceChoice<T extends string>(key: string, allowed: readonly [T, ...T[]]): T {
  try {
    const value = Platform.OS === 'web' ? window.localStorage.getItem(key) : SecureStore.getItem(key);
    return allowed.find((choice) => choice === value) ?? allowed[0];
  } catch {
    return allowed[0];
  }
}

export function saveDeviceChoice(key: string, value: string) {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(key, value);
    else void SecureStore.setItemAsync(key, value).catch(() => {});
  } catch {
    // A choice that cannot be stored still applies until the app restarts.
  }
}
