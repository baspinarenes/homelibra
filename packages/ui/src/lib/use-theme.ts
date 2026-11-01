import { useMemo, useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { type Colors, palette, type Scheme, type Shadows, shadows } from './tokens';

/** The Sistem / Açık / Koyu choice in Ayarlar. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** Where the app keeps the choice: read once at startup, written on every change. */
export type ThemePreferenceStorage = {
  load: () => ThemePreference;
  save: (preference: ThemePreference) => void;
};

let storage: ThemePreferenceStorage | undefined;
let preference: ThemePreference = 'system';
const listeners = new Set<() => void>();
const current = () => preference;
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Hands the package the app's place for the choice. Call it before the first
 * render, so the first frame already has the right theme. Without it the
 * choice lasts until the app closes.
 */
export function keepThemePreferenceIn(next: ThemePreferenceStorage) {
  storage = next;
  preference = next.load();
  notify();
}

/** The Sistem / Açık / Koyu choice. Sistem by default. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, current, current);
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  storage?.save(next);
  notify();
}

/** The theme follows the system unless Ayarlar pins it to Açık or Koyu. */
export function useTheme(): { scheme: Scheme; colors: Colors; shadow: Shadows } {
  const system = useColorScheme();
  const choice = useThemePreference();
  const scheme: Scheme = choice === 'system' ? (system === 'dark' ? 'dark' : 'light') : choice;
  return { scheme, colors: palette[scheme], shadow: shadows[scheme] };
}

/** Styles for the current theme. Pass a module-level `make` so they are built once per theme. */
export function useThemedStyles<T>(make: (c: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => make(colors), [colors, make]);
}
