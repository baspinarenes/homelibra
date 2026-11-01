import { type Colors, space, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { StyleSheet, View } from 'react-native';

import { useHomeDivider } from '@/lib/home-appearance';

/**
 * What stands above each of Genel Bakış's sections after the first, as
 * Ayarlar picks: a `line` rule with a soft shadow under it (Çizgi), or an
 * 8px `line` band (Şerit). Either runs past the gutter to both edges of the screen.
 */
export function HomeDivider() {
  const styles = useThemedStyles(makeStyles);
  const { shadow } = useTheme();
  const divider = useHomeDivider();
  return <View style={divider === 'band' ? styles.band : [styles.rule, { boxShadow: shadow.rule }]} />;
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    rule: { height: 1, marginHorizontal: -space.gutter, backgroundColor: c.line },
    band: { height: 8, marginHorizontal: -space.gutter, backgroundColor: c.line },
  });
