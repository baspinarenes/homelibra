import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

// Line icons from the library-nav prototype, on a 24×24 grid.
const shapes = {
  home: <Path d="M4 11l8-6.5 8 6.5V20h-5.5v-5.5h-5V20H4z" />,
  sources: (
    <>
      <Path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12H8.5A3.5 3.5 0 0 1 5 16.5v-12z" />
      <Path d="M5 16.5A3.5 3.5 0 0 1 8.5 13H19" />
    </>
  ),
  tags: (
    <>
      <Path d="M3.5 11.5V4h7.5l9.5 9.5-7.5 7.5-9.5-9.5z" />
      <Circle cx="7.8" cy="8.3" r="1.4" />
    </>
  ),
  collections: <Path d="M3.5 6.5h6l2 2h9v10.5h-17z" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="M20 20l-4.3-4.3" />
    </>
  ),
} as const;

export type TabIconName = keyof typeof shapes;

export function TabIcon({ name, color, size = 22 }: { name: TabIconName; color: ColorValue; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {shapes[name]}
    </Svg>
  );
}
