import type { SourceType } from '@homelibra/core/source';
import { coverColors, coverStripe } from '@homelibra/ui/theme';
import { View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

/**
 * A cover's box: `small` for list rows (design system, size s), `large` for
 * Kaldığın yer on Genel Bakış, `table` beside a Başlık in the wide Kaynaklar table.
 */
export const coverSizes = {
  small: { width: 40, height: 56 },
  large: { width: 56, height: 80 },
  table: { width: 24, height: 34 },
} as const;
export type CoverSize = keyof typeof coverSizes;

/**
 * Stands for a Source without a Cover: 135° stripes in its type's colour, no
 * icon (design system, TemplateCover). A Cover fills the same box once it lands (P1).
 */
export function TemplateCover({ type, size = 'small' }: { type: SourceType; size?: CoverSize }) {
  const { width, height } = coverSizes[size];
  const stripes = `stripes-${type}`;
  return (
    <View
      className="overflow-hidden rounded-cover"
      style={{ width, height }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id={stripes} patternUnits="userSpaceOnUse" width={12} height={12} patternTransform="rotate(135)">
            <Rect x={6} width={6} height={12} fill={coverStripe} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill={coverColors[type]} />
        <Rect width={width} height={height} fill={`url(#${stripes})`} />
      </Svg>
    </View>
  );
}
