import type { SourceType } from '@homelibra/core/source';
import { keepThemePreferenceIn, radius as scale } from '@homelibra/ui/theme';

import { loadThemePreference, saveThemePreference } from '@/lib/theme-preference';

// The tokens and the theme hook live in @homelibra/ui; this module keeps the
// app's old imports working while the screens move over to the package.
export {
  type Colors,
  fonts,
  palette,
  type Scheme,
  setThemePreference,
  space,
  type ThemePreference,
  type,
  useTheme,
  useThemedStyles,
  useThemePreference,
  wideMinWidth,
} from '@homelibra/ui/theme';

// Read synchronously at startup, so the first frame already has the right theme.
keepThemePreferenceIn({ load: loadThemePreference, save: saveThemePreference });

/**
 * The corner scale with the names the screens still use: `input`, `button`
 * and `card` are now all `control` (8), `hero` is `sheet` (12).
 */
export const radius = {
  ...scale,
  input: scale.control,
  button: scale.control,
  card: scale.control,
  hero: scale.sheet,
} as const;

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
