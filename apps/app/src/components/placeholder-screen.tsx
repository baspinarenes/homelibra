import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** Stands in for a tab whose screens arrive in a later ticket. */
export function PlaceholderScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{t('placeholder.comingSoon')}</Text>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    text: { ...typeScale.body, color: c.muted },
  });
