import { Section, SectionText } from '@homelibra/ui/section-heading';
import { SettingsRow, SettingsRows } from '@homelibra/ui/settings-row';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { contactEmail } from '@/lib/contact';
import { legalVersion } from '@/lib/legal';

/**
 * The sections that read the same signed in or not: in Ayarlar and on the
 * Gizlilik web page that needs no sign-in (#40, stories 14-15). The
 * documents, with the version of their text under them.
 */
export function PrivacyDocumentsSection() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  return (
    <Section title={t('privacy.privacySection')} spacing="rows">
      <SettingsRows>
        <SettingsRow label={t('privacy.notice')} onPress={() => router.push('/privacy/notice')} />
        <SettingsRow label={t('privacy.terms')} onPress={() => router.push('/privacy/terms')} />
      </SettingsRows>
      <Text style={styles.version}>{t('privacy.version', { version: legalVersion })}</Text>
    </Section>
  );
}

export function ContactSection() {
  const { t } = useTranslation();
  return (
    <Section title={t('privacy.contactSection')} spacing="text">
      <SectionText>{t('privacy.contactLead')}</SectionText>
      <ContactLink />
    </Section>
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
    version: { ...typeScale.caption, color: c.muted, marginTop: space.xs },
    link: { ...typeScale.label, color: c.accent },
  });
