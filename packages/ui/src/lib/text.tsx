import type { ReactNode } from 'react';
import { Text as NativeText, type StyleProp, StyleSheet, type TextProps, type TextStyle } from 'react-native';

import { type Colors, type as typeScale } from './tokens';
import { useThemedStyles } from './use-theme';

export type Variant = keyof typeof typeScale;

/**
 * Each entry's colour unless the screen names another: the one most of the app
 * set it in by hand before this component (#145). `strong` and `strongSerif`
 * have none: they sit inside another Text and take its colour.
 */
const defaultColor: { [V in Variant]: keyof Colors | undefined } = {
  display: 'fg',
  title: 'fg',
  screenTitle: 'fg',
  sourceTitle: 'fg',
  sourceTitleSm: 'fg',
  summary: 'ink2',
  strongSerif: undefined,
  excerpt: 'quoteInk',
  excerptSm: 'quoteInk',
  excerptLg: 'fg',
  body: 'ink2',
  bodyLg: 'fg',
  bodySm: 'fg',
  comment: 'ink3',
  commentSm: 'ink3',
  choice: 'fg',
  choiceStrong: 'accent',
  strong: undefined,
  bodyStrong: 'fg',
  bodySmStrong: 'fg',
  button: 'accent',
  action: 'accent',
  textTab: 'muted',
  more: 'muted',
  label: 'fg',
  labelSm: 'fg',
  wheel: 'muted2',
  wheelCentre: 'fg',
  keyHint: 'muted',
  link: 'accent',
  caption: 'muted',
  captionSm: 'muted',
  tab: 'fg',
  heading: 'muted',
  fieldLabel: 'muted',
  micro: 'muted',
  locator: 'muted',
  locatorSm: 'accent',
  locatorKey: 'fg',
  locatorInput: 'fg',
  key: 'fg',
  count: 'muted',
  collectionCount: 'muted',
  term: 'fg',
  operator: 'ink3',
  signInCode: 'fg',
  identifier: 'fg',
};

const variants = Object.keys(typeScale) as Variant[];

// One sheet per theme, so a Text is classes on web, not an inline style:
// each entry with its colour, and each colour on its own for `color`.
const makeStyles = (c: Colors) => ({
  variants: StyleSheet.create(
    Object.fromEntries(
      variants.map((variant) => {
        const color = defaultColor[variant];
        return [variant, color ? { ...typeScale[variant], color: c[color] } : typeScale[variant]];
      }),
    ) as Record<Variant, TextStyle>,
  ),
  colors: StyleSheet.create(
    Object.fromEntries(Object.entries(c).map(([name, value]) => [name, { color: value }])) as Record<
      keyof Colors,
      TextStyle
    >,
  ),
});

/**
 * What a screen may set on a Text: where it stands, never its face, size, line,
 * colour or case (textTransform's upper case is locale-blind: i becomes I, not İ).
 */
type TextLayout = Omit<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontWeight' | 'textTransform' | 'color'
>;

/** Entries set in upper case, by Turkish rules: their words come as one string. */
const upperCaseVariants = ['screenTitle', 'heading', 'fieldLabel', 'micro'] as const satisfies readonly Variant[];
export type UpperCaseVariant = (typeof upperCaseVariants)[number];
const upperCase = new Set<Variant>(upperCaseVariants);

/** Entries a screen reader lands on as a heading unless the screen says otherwise. */
const headings = new Set<Variant>(['display', 'title', 'screenTitle', 'sourceTitle', 'heading']);

type Props = Omit<TextProps, 'style' | 'children'> & {
  /** A colour of the theme other than the entry's own. */
  color?: keyof Colors;
  style?: StyleProp<TextLayout>;
} & (
    | { variant: Exclude<Variant, UpperCaseVariant>; children?: ReactNode }
    | { variant: UpperCaseVariant; children: string }
  );

/**
 * A run of text in one `type` entry, in that entry's colour. Title and section
 * entries are headings (`role={undefined}` makes one plain text); the mono
 * labels upper-case their words with `toLocaleUpperCase('tr')`.
 */
export function Text(props: Props) {
  const { variant, color, style, children, ...rest } = props;
  const styles = useThemedStyles(makeStyles);
  const role = 'role' in props ? props.role : headings.has(variant) ? 'heading' : undefined;
  return (
    <NativeText {...rest} role={role} style={[styles.variants[variant], color && styles.colors[color], style]}>
      {upperCase.has(variant) && typeof children === 'string' ? children.toLocaleUpperCase('tr') : children}
    </NativeText>
  );
}
