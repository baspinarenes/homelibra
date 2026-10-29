import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, space } from '@/theme';

/** Stands in for a tab whose screens arrive in a later ticket. */
export function PlaceholderScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <Text style={styles.text}>{t('placeholder.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: colors.page },
  text: { fontSize: 15, color: colors.muted },
});
