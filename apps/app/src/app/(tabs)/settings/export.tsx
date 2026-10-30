import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LibraryExportDownload } from '@/components/library-export';
import { SettingsSection, SettingsText } from '@/components/settings-list';
import { type Colors, space, useThemedStyles } from '@/theme';

/**
 * Kütüphaneni dışa aktar (#40, stories 16-18; ADR-0004): what the ZIP
 * holds, and its download. Free and at any time; Hesabı sil links here.
 */
export default function LibraryExportScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <SettingsText>{t('libraryExport.lead')}</SettingsText>
        <LibraryExportDownload />
      </View>
      <SettingsSection title={t('libraryExport.contentsHeading')}>
        <SettingsText>{t('libraryExport.json')}</SettingsText>
        <SettingsText>{t('libraryExport.markdown')}</SettingsText>
        <SettingsText>{t('libraryExport.covers')}</SettingsText>
      </SettingsSection>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: space.lg },
    top: { gap: space.sm, paddingVertical: space.lg },
  });
