import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { ToOrganizeRow, useToOrganize } from '@/components/to-organize';

/**
 * Düzenlenecekler (#13), from Genel bakış's strip: every Source with an
 * untagged Note since its last "Bitir", the finished ones first, each part
 * the last noted first. A row opens
 * the Source page, where "Düzenle · N etiketsiz" starts the work.
 */
export default function ToOrganizeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const sources = useToOrganize();

  if (!sources.data) {
    return (
      <View style={styles.center}>
        {sources.isError ? (
          <Text style={styles.lead}>{t('organize.loadFailed')}</Text>
        ) : (
          <ActivityIndicator color={colors.accent} />
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
    content: { paddingHorizontal: space.gutter, paddingBottom: space.xxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, backgroundColor: c.page },
    hint: { ...typeScale.caption, color: c.muted, paddingTop: space.xs, paddingBottom: space.sm },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center', paddingVertical: space.xl },
  });
