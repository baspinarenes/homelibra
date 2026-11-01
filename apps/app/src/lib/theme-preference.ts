import { loadDeviceChoice, saveDeviceChoice } from '@/lib/device-choice';

/** The Sistem / Açık / Koyu choice in Ayarlar. */
export type ThemePreference = 'system' | 'light' | 'dark';

const key = 'homelibra.theme';

/** Kept on this device only; Sistem until a choice is made. */
export const loadThemePreference = (): ThemePreference =>
  loadDeviceChoice<ThemePreference>(key, ['system', 'light', 'dark']);

export const saveThemePreference = (value: ThemePreference) => saveDeviceChoice(key, value);
