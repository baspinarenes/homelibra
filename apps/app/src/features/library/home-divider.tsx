import { View } from 'react-native';

import { useHomeDivider } from '@/lib/appearance-choices';

/**
 * What stands above each of Genel Bakış's sections after the first, as
 * Ayarlar picks: a `line` rule with a soft shadow under it (Çizgi), or an
 * 8px `line` band (Şerit). Either runs past the gutter to both edges of the screen.
 */
export function HomeDivider() {
  const divider = useHomeDivider();
  return <View className={divider === 'band' ? '-mx-gutter h-2 bg-line' : '-mx-gutter h-px bg-line shadow-rule'} />;
}
