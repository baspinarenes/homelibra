import type { SourceType } from '@homelibra/core/source';
import { useMemo, useSyncExternalStore } from 'react';
import { useColorScheme } from 'react-native';

import { loadThemePreference, saveThemePreference, type ThemePreference } from '@/lib/theme-preference';

export type { ThemePreference };

// Tokens from the visual identity decision (#68) and its design system:
// paper ground, ink text, one accent (Terracotta). Light and dark share the key names.
export const palette = {
  light: {
    page: '#F6F2EA',
    surface: '#FFFEFB',
    line: '#EAE3D5',
    lineSoft: '#F0E9DC',
    lineStrong: '#8F8572',
    fg: '#2A2520',
    ink3: '#3F3A33',
    ink2: '#6A6358',
    muted: '#756C60',
    muted2: '#A99F8E',
    faint: '#C2BAAA',
    accent: '#A65A40',
    accentFg: '#FFF6EE',
    accentSub: '#FCF0E8',
    accentSoft: '#F4E4DA',
    chipBg: '#EFE7D7',
    chipInk: '#6C5E3F',
    quoteBar: '#DCC9B0',
    quoteInk: '#4A443B',
    warn: '#8F5E14',
    warnSoft: '#F3E6CC',
    danger: '#A3352B',
    dangerSoft: '#F6E1DC',
    mark: '#F5DE9C',
    tabBg: 'rgba(246,242,234,0.94)',
    scrim: 'rgba(42,37,32,0.38)', // behind a sheet
  },
  dark: {
    page: '#1C1813',
    surface: '#262019',
    line: '#382F25',
    lineSoft: '#2F2820',
    lineStrong: '#7A6F60',
    fg: '#F0E8DB',
    ink3: '#E2D9CB',
    ink2: '#BBB2A4',
    muted: '#988E80',
    muted2: '#7E7468',
    faint: '#615749',
    accent: '#D08A6E',
    accentFg: '#1C1813',
    accentSub: '#3B2A20',
    accentSoft: '#3A2A20',
    chipBg: '#33291B',
    chipInk: '#D8BC8E',
    quoteBar: '#4D4234',
    quoteInk: '#D0C7B9',
    warn: '#E0B060',
    warnSoft: '#3A2E18',
    danger: '#EE8E80',
    dangerSoft: '#3D211C',
    mark: '#5C4A18',
    tabBg: 'rgba(28,24,19,0.94)',
    scrim: 'rgba(0,0,0,0.55)',
  },
} as const;

export type Scheme = keyof typeof palette;
export type Colors = { readonly [K in keyof typeof palette.light]: string };

// Template cover stripes, one colour per Source type; the same in both themes.
export const coverColors: Record<SourceType, string> = {
  book: '#A0634A',
  article: '#5E7A9A',
  thesis: '#8A6B8A',
  archive: '#7A6B4A',
  manuscript: '#8C6A3C',
  periodical: '#6B8A6B',
  recording: '#9A6B7A',
  webPage: '#4F7F86',
  other: '#6B6B6B',
};

// From this width up, web gets the left tab rail and the two-column Source form.
export const wideMinWidth = 720;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, gutter: 22, xl: 24, xxl: 32 } as const;

// Tight corners: the pill shape is only for count badges and switches.
export const radius = { cover: 3, chip: 6, input: 8, button: 8, card: 10, hero: 12, pill: 999 } as const;

const shadows = {
  light: { card: '0 1px 4px rgba(42,37,32,0.10)', lift: '0 8px 22px rgba(42,37,32,0.16)' },
  dark: { card: '0 1px 3px rgba(0,0,0,0.35)', lift: '0 8px 22px rgba(0,0,0,0.45)' },
} as const;

// Family names as registered by the @expo-google-fonts packages; loaded in the root layout.
export const fonts = {
  serif: 'EBGaramond_400Regular',
  serifMedium: 'EBGaramond_500Medium',
  quote: 'CharisSIL_400Regular',
  sans: 'RedditSans_400Regular',
  sansMedium: 'RedditSans_500Medium',
  sansSemiBold: 'RedditSans_600SemiBold',
  mono: 'RedditMono_500Medium',
} as const;

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 34 }, // tab root title
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30 }, // pushed screen, Collection name
  sourceTitle: { fontFamily: fonts.serifMedium, fontSize: 21, lineHeight: 25 },
  sourceTitleSm: { fontFamily: fonts.serifMedium, fontSize: 17, lineHeight: 20 }, // list row
  excerpt: { fontFamily: fonts.quote, fontSize: 16, lineHeight: 25 }, // + 2px quoteBar left rule
  excerptSm: { fontFamily: fonts.quote, fontSize: 15, lineHeight: 23 }, // Son not aldığın on Ana sayfa
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 18 },
  label: { fontFamily: fonts.sansMedium, fontSize: 13.5, lineHeight: 18 },
  caption: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17 },
  tab: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, lineHeight: 13 },
  micro: { fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.4 }, // upper-case with toLocaleUpperCase('tr')
  locator: { fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 17 },
} as const;

let preference: ThemePreference = loadThemePreference();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The Sistem / Açık / Koyu choice in Ayarlar, kept on this device. Sistem by default. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference);
}

export function setThemePreference(next: ThemePreference) {
  preference = next;
  saveThemePreference(next);
  listeners.forEach((listener) => listener());
}

/** The theme follows the system unless Ayarlar pins it to Açık or Koyu. */
export function useTheme() {
  const system = useColorScheme();
  const choice = useThemePreference();
  const scheme: Scheme = choice === 'system' ? (system === 'dark' ? 'dark' : 'light') : choice;
  return { scheme, colors: palette[scheme] as Colors, shadow: shadows[scheme] };
}

/** Styles for the current theme. Pass a module-level `make` so they are built once per theme. */
export function useThemedStyles<T>(make: (c: Colors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => make(colors), [colors, make]);
}
