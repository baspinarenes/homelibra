import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { ContactLink, ContactSection, PrivacyDocumentsSection } from '@/components/privacy-sections';
import { SettingsSection, SettingsText } from '@/components/settings-list';
import { type Colors, space, useThemedStyles } from '@/theme';

/**
 * Hesap ve gizlilik without signing in, so a scholar who cannot get into the
 * app still finds the privacy notice and the way to delete their Account.
 */
export default function PublicPrivacyScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PrivacyDocumentsSection />
      <SettingsSection title={t('privacy.deleteSection')}>
        <SettingsText>{t('privacy.deleteInApp')}</SettingsText>
        <SettingsText>{t('privacy.deleteByEmail')}</SettingsText>
        <ContactLink />
      </SettingsSection>
      <ContactSection />
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { alignSelf: 'center', width: '100%', maxWidth: 640, paddingHorizontal: space.lg },
  });
