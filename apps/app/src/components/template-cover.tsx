import type { SourceType } from '@homelibra/core/source';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { coverColors, radius } from '@/theme';

/** A cover's box: `small` for list rows (design system, size s), `large` for Kaldığın yer on Genel bakış. */
export const coverSizes = { small: { width: 40, height: 56 }, large: { width: 56, height: 80 } } as const;
export type CoverSize = keyof typeof coverSizes;

/**
 * Stands for a Source without a Cover: 135° stripes in its type's colour, no
 * icon (design system, TemplateCover). A Cover fills the same box once it lands (P1).
 */
export function TemplateCover({ type, size = 'small' }: { type: SourceType; size?: CoverSize }) {
  const { width, height } = coverSizes[size];
  const stripes = `stripes-${type}`;
  return (
    <View style={[styles.box, { width, height }]} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id={stripes} patternUnits="userSpaceOnUse" width={12} height={12} patternTransform="rotate(135)">
            <Rect x={6} width={6} height={12} fill="rgba(255,255,255,0.18)" />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill={coverColors[type]} />
        <Rect width={width} height={height} fill={`url(#${stripes})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.cover, overflow: 'hidden' },
});
