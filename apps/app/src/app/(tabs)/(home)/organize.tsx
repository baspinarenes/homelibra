import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { ToOrganizeRow, useToOrganize } from '@/components/to-organize';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Düzenlenecekler (#13), from Ana sayfa's strip: every Source with an
 * untagged Note since its last "Bitir", the last noted first. A row opens
 * the Source page, where "Düzenle · N etiketsiz" starts the work.
 */
export default function ToOrganizeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const sources = useToOrganize();

  if (!sources.data) {
    return (
      <View style={styles.center}>
        {sources.isError ? (
          <Text style={styles.lead}>{t('organize.loadFailed')}</Text>
        ) : (
          <ActivityIndicator color={styles.spinner.color} />
        )}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={sources.data}
      keyExtractor={(source) => source.id}
      ListHeaderComponent={<Text style={styles.hint}>{t('organize.lead')}</Text>}
      ListEmptyComponent={<Text style={styles.lead}>{t('organize.empty')}</Text>}
      renderItem={({ item, index }) => <ToOrganizeRow source={item} divided={index > 0} />}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    spinner: { color: c.accent },
    hint: { ...typeScale.caption, color: c.muted, paddingTop: space.sm, paddingBottom: space.xs },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center', paddingVertical: space.xl },
  });
