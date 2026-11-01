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
    accentRule: 'rgba(255,246,238,0.3)', // a rule on `accent`: accentFg at 30%
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
    accentRule: 'rgba(28,24,19,0.3)',
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

// Every line is at least as tall as its face's ascent and descent at that size: on a shorter
// line Android cuts the glyphs, g, ğ, y, ş and ç below first (the theme test holds each entry to it).
// The app writes no size of its own, so a size a screen needs is an entry here.
export const type = {
  display: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 42 }, // welcome and sign-in title
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 34 }, // Collection name
  screenTitle: { fontFamily: fonts.mono, fontSize: 15, lineHeight: 20, letterSpacing: 2.2 }, // every screen's header, upper case
  sourceTitle: { fontFamily: fonts.serifMedium, fontSize: 21, lineHeight: 28 }, // also a sheet's title
  sourceTitleSm: { fontFamily: fonts.serifMedium, fontSize: 17, lineHeight: 23 }, // a list row
  excerpt: { fontFamily: fonts.quote, fontSize: 16, lineHeight: 27 }, // + 2px quoteBar left rule
  excerptSm: { fontFamily: fonts.quote, fontSize: 15, lineHeight: 25 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 }, // a form's error, Arama ipuçları
  comment: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22 }, // a Note's comment under its excerpt
  commentSm: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22 }, // the same under excerptSm
  choice: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 22 }, // an option in a sheet
  // Heavier Reddit Sans at the size of the line it sits in: a link or a name inside running text;
  // with `body` it is the design system's t-strong.
  strong: { fontFamily: fonts.sansSemiBold },
  button: { fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 19 }, // also a small Button, a toast's action
  action: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 20 }, // Button, a header's Kaydet
  textTab: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 21 }, // TextTabs
  more: { fontFamily: fonts.sansSemiBold, fontSize: 18, lineHeight: 24 }, // a row's ⋯
  label: { fontFamily: fonts.sansMedium, fontSize: 13.5, lineHeight: 18 },
  labelSm: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18 }, // a Chip, a compact Segment
  wheel: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 20 }, // Wheels' rows around the centre
  wheelCentre: { fontFamily: fonts.sansMedium, fontSize: 18, lineHeight: 24 },
  keyHint: { fontFamily: fonts.sansMedium, fontSize: 17, lineHeight: 34 }, // an empty locatorKey, as tall as it
  link: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, lineHeight: 18 },
  caption: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17 },
  captionSm: { fontFamily: fonts.sans, fontSize: 11, lineHeight: 15 }, // a Source type's scope
  tab: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, lineHeight: 14 },
  heading: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 1.2 }, // SectionHeading, upper case
  fieldLabel: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 15, letterSpacing: 1.1 }, // TextField's label, upper case
  micro: { fontFamily: fonts.mono, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.4 }, // upper-case with toLocaleUpperCase('tr')
  locator: { fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 17 }, // also TextTabs' count
  locatorSm: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 }, // the composer's Locator
  locatorKey: { fontFamily: fonts.mono, fontSize: 26, lineHeight: 34 }, // the Locator being keyed in
  locatorInput: { fontFamily: fonts.mono, fontSize: 18, lineHeight: 24 }, // the same typed freely
  key: { fontFamily: fonts.mono, fontSize: 21, lineHeight: 28 }, // a key of the Locator pad
  count: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 17 }, // a tally or a time after a name in a row
  collectionCount: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 }, // a Collection's notes
  term: { fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 22 }, // TermTable's term, on body's line
  operator: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 20 }, // an operator in Arama ipuçları, on bodySm's line
  signInCode: { fontFamily: fonts.mono, fontSize: 24, lineHeight: 32, letterSpacing: 8 }, // a sign-in code
  identifier: { fontFamily: fonts.monoRegular, fontSize: 15, lineHeight: 22 }, // an ISBN or a DOI, typed and placeholder
} as const;

// A template cover's ground, one per Source type, the same in both themes; light stripes run over it.
export const coverColors = {
  book: '#A0634A',
  article: '#5E7A9A',
  thesis: '#8A6B8A',
  archive: '#7A6B4A',
  manuscript: '#8C6A3C',
  periodical: '#6B8A6B',
  recording: '#9A6B7A',
  webPage: '#4F7F86',
  other: '#6B6B6B',
} as const;

export const coverStripe = 'rgba(255,255,255,0.18)';
