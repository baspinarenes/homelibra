import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { SettingsRow, SettingsSection, SettingsText } from '@/components/settings-list';
import { contactEmail } from '@/lib/contact';
import { type Colors, type as typeScale, useThemedStyles } from '@/theme';

/**
 * The parts of Hesap ve gizlilik that read the same signed in or not: in
 * Ayarlar and on the web page that needs no sign-in (#40, stories 14-15).
 * The documents come first on both pages.
 */
export function PrivacyDocumentsSection() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <SettingsSection title={t('privacy.privacySection')} first>
      <SettingsRow label={t('privacy.notice')} onPress={() => router.push('/privacy/notice')} />
      <SettingsRow label={t('privacy.terms')} onPress={() => router.push('/privacy/terms')} />
    </SettingsSection>
  );
}

export function ContactSection() {
  const { t } = useTranslation();
  return (
    <SettingsSection title={t('privacy.contactSection')}>
      <SettingsText>{t('privacy.contactLead')}</SettingsText>
      <ContactLink />
    </SettingsSection>
  );
}

export function ContactLink() {
  const styles = useThemedStyles(makeStyles);
  return (
    <Text accessibilityRole="link" style={styles.link} onPress={() => Linking.openURL(`mailto:${contactEmail}`)}>
      {contactEmail}
    </Text>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    link: { ...typeScale.label, color: c.accent },
  });
