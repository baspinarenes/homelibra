import { Section, Sections, SectionText } from '@homelibra/ui/section-heading';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { ContactLink, ContactSection, PrivacyDocumentsSection } from '@/components/privacy-sections';

/**
 * Gizlilik without signing in, so a scholar who cannot get into the app
 * still finds the privacy notice and the way to delete their Account.
 */
export default function PublicPrivacyScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { alignSelf: 'center', width: '100%', maxWidth: 640, paddingHorizontal: space.lg },
  });
