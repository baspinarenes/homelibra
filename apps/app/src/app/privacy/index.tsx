import { Section, Sections, SectionText } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { ReadingColumn } from '@/features/privacy/legal-document';
import { ContactLink, ContactSection, PrivacyDocumentsSection } from '@/features/privacy/privacy-sections';

/**
 * Gizlilik without signing in, so a scholar who cannot get into the app
 * still finds the privacy notice and the way to delete their Account. On a
 * wide screen it reads in the legal texts' column, under its title (#185).
 */
export default function PublicPrivacyScreen() {
  const { t } = useTranslation();
  const wide = useWideLayout().tier === 'wide';
  const sections = (
    <Sections>
      <PrivacyDocumentsSection />
      <Section title={t('privacy.deleteSection')} spacing="text">
        <SectionText>{t('privacy.deleteInApp')}</SectionText>
        <SectionText>{t('privacy.deleteByEmail')}</SectionText>
        <ContactLink />
      </Section>
      <ContactSection />
    </Sections>
  );
  if (wide) {
    return (
      // Nowhere to go back to, the way back is the app's start: the Library, or Giriş signed out.
      <ReadingColumn back="/">
        <Text variant="display" role="heading">
          {t('privacy.title')}
        </Text>
        {sections}
      </ReadingColumn>
    );
  }
  return (
    <ScrollView className="flex-1 bg-page" contentContainerClassName="w-full max-w-[640px] self-center px-lg">
      {sections}
    </ScrollView>
  );
}
