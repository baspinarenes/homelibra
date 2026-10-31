// Tokens from the visual identity decision (#68) and its design system:
// paper ground, ink text, one accent (Terracotta). Light and dark share the key names.
// The design system names three of them differently: its `card` is `surface`,
// `border` is `line` and `border-soft` is `lineSoft`.
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
    scrim: 'rgba(42,37,32,0.38)', // behind a sheet or a dialog
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

export const shadows = {
  light: { card: '0 1px 4px rgba(42,37,32,0.10)', lift: '0 8px 22px rgba(42,37,32,0.16)' },
  dark: { card: '0 1px 3px rgba(0,0,0,0.35)', lift: '0 8px 22px rgba(0,0,0,0.45)' },
} as const;

export type Shadows = { readonly card: string; readonly lift: string };

// From this width up, web gets the left tab rail and the two-column Source form.
export const wideMinWidth = 720;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, gutter: 22, xl: 24, xxl: 32 } as const;

/**
 * Tight corners (#108). `control` is every input, button, drop-down, segment,
 * card, toast, dialog and pressed tab; `sheet` only a sheet's top corners;
 * `pill` only a switch and a dot.
 */
export const radius = { cover: 3, chip: 6, control: 8, sheet: 12, pill: 999 } as const;

// Family names as registered by the @expo-google-fonts packages; loaded in the app's root layout.
export const fonts = {
  serif: 'EBGaramond_400Regular',
  serifMedium: 'EBGaramond_500Medium',
  quote: 'CharisSIL_400Regular',
  sans: 'RedditSans_400Regular',
  sansMedium: 'RedditSans_500Medium',
  sansSemiBold: 'RedditSans_600SemiBold',
  mono: 'RedditMono_500Medium',
  monoRegular: 'RedditMono_400Regular',
} as const;

export const type = {
  display: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 34 }, // tab root title
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30 }, // Collection name
  screenTitle: { fontFamily: fonts.serifMedium, fontSize: 20, lineHeight: 26 }, // pushed screen's header
  sourceTitle: { fontFamily: fonts.serifMedium, fontSize: 21, lineHeight: 25 }, // also a sheet's title
  sourceTitleSm: { fontFamily: fonts.serifMedium, fontSize: 17, lineHeight: 20 }, // list row
  excerpt: { fontFamily: fonts.quote, fontSize: 16, lineHeight: 25 }, // + 2px quoteBar left rule
  excerptSm: { fontFamily: fonts.quote, fontSize: 15, lineHeight: 23 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 18 },
  action: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 18 }, // Button, a header's Kaydet
  label: { fontFamily: fonts.sansMedium, fontSize: 13.5, lineHeight: 18 },
  link: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, lineHeight: 18 },
  caption: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17 },
  tab: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, lineHeight: 13 },
  heading: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, // SectionHeading, upper case
  fieldLabel: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14, letterSpacing: 1.1 }, // TextField's label, upper case
  micro: { fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.4 }, // upper-case with toLocaleUpperCase('tr')
  locator: { fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 17 },
  identifier: { fontFamily: fonts.monoRegular, fontSize: 15, lineHeight: 22 }, // an ISBN or a DOI, typed and placeholder
} as const;
