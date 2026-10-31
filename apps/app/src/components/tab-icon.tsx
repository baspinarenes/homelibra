import BookA from 'lucide-react-native/icons/book-a';
import House from 'lucide-react-native/icons/house';
import Library from 'lucide-react-native/icons/library';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import type { ColorValue } from 'react-native';

// Lucide line icons, as in @homelibra/ui's TabBar, for the left rail on desktop web.
// One import per icon keeps the bundle small.
const icons = { home: House, sources: Library, collections: BookA, search: Search, settings: Settings } as const;

export type TabIconName = keyof typeof icons;

export function TabIcon({ name, color, size = 22 }: { name: TabIconName; color: ColorValue; size?: number }) {
  const Icon = icons[name];
  return <Icon color={color} size={size} strokeWidth={1.6} />;
}
