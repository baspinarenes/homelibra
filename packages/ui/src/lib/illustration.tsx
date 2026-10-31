import Svg, { Circle, G, Path } from 'react-native-svg';

import { useTheme } from './use-theme';

/**
 * An open book in line: written lines on the left page, a quote with its bar
 * on the right, a ribbon and a tag, in the theme's colours. Decoration only,
 * so screen readers skip it. Drawn at 280 × 175; its left page starts 8px in.
 */
export function BookIllustration() {
  const { colors: c } = useTheme();
  const page = { fill: c.surface, stroke: c.lineStrong, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const line = { stroke: c.faint, strokeWidth: 2, strokeLinecap: 'round' as const, fill: 'none' };
  return (
    <Svg width={280} height={175} viewBox="0 0 240 150" aria-hidden>
      <Path {...page} d="M120 34 C96 24 60 22 24 30 V128 C60 120 96 122 120 132 Z" />
      <Path {...page} d="M120 34 C144 24 180 22 216 30 V128 C180 120 144 122 120 132 Z" />
      <Path stroke={c.lineStrong} strokeWidth={1.4} fill="none" d="M120 34 V132" />
      <Path {...line} d="M38 50 H104 M38 62 H100 M38 74 H106 M38 86 H96 M38 98 H104 M38 110 H88" />
      <Path stroke={c.quoteBar} strokeWidth={2.5} strokeLinecap="round" fill="none" d="M136 52 V84" />
      <Path
        stroke={c.quoteInk}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
        d="M144 54 H200 M144 66 H196 M144 78 H184"
      />
      <Path {...line} d="M136 100 H196" />
      <Path fill={c.accent} d="M190 25 V58 L183 52 L176 58 V26 Z" />
      <G transform="translate(150 116) rotate(-10)">
        <Path
          fill={c.chipBg}
          stroke={c.chipInk}
          strokeWidth={1.2}
          strokeLinejoin="round"
          d="M0 0 H40 L50 10 L40 20 H0 Z"
        />
        <Circle fill={c.page} stroke={c.chipInk} strokeWidth={1} cx={40} cy={10} r={2.5} />
      </G>
    </Svg>
  );
}
