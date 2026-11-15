import { Section, SectionText } from '@homelibra/ui/section-heading';
import { TermTable } from '@homelibra/ui/term-table';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SettingsPage } from '@/features/account/settings-page';
import { LibraryExportDownload } from '@/features/library/library-export';

/**
 * Kütüphaneni dışa aktar (#40, stories 16-18; ADR-0004): what the ZIP
 * holds, file by file in a table (#115), and its download. Free and at any
 * time; Hesabı sil links here.
 */
export default function LibraryExportScreen() {
  const { t } = useTranslation();
  return (
    <SettingsPage title={t('libraryExport.title')} back phone="w-full max-w-[560px] self-center px-lg">
      <View className="gap-sm py-lg">
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
    </SettingsPage>
  );
}
