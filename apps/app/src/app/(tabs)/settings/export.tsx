import { Section, SectionText } from '@homelibra/ui/section-heading';
import { TermTable } from '@homelibra/ui/term-table';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { LibraryExportDownload } from '@/components/library-export';

/**
 * Kütüphaneni dışa aktar (#40, stories 16-18; ADR-0004): what the ZIP
 * holds, file by file in a table (#115), and its download. Free and at any
 * time; Hesabı sil links here.
 */
export default function LibraryExportScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <SectionText>{t('libraryExport.lead')}</SectionText>
        <LibraryExportDownload />
      </View>
      <Section title={t('libraryExport.contentsHeading')} spacing="text">
        <TermTable
          rows={t('libraryExport.files', { returnObjects: true }).map((file) => ({
            term: file.name,
            description: file.description,
          }))}
        />
      </Section>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: space.lg },
    top: { gap: space.sm, paddingVertical: space.lg },
  });
