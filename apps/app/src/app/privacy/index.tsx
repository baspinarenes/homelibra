import { Section, Sections, SectionText } from '@homelibra/ui/section-heading';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { ContactLink, ContactSection, PrivacyDocumentsSection } from '@/features/privacy/privacy-sections';

/**
 * Gizlilik without signing in, so a scholar who cannot get into the app
 * still finds the privacy notice and the way to delete their Account.
 */
export default function PublicPrivacyScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView className="flex-1 bg-page" contentContainerClassName="w-full max-w-[640px] self-center px-lg">
      <Sections>
        <PrivacyDocumentsSection />
        <Section title={t('privacy.deleteSection')} spacing="text">
          <SectionText>{t('privacy.deleteInApp')}</SectionText>
          <SectionText>{t('privacy.deleteByEmail')}</SectionText>
          <ContactLink />
        </Section>
        <ContactSection />
      </Sections>
    </ScrollView>
  );
}
