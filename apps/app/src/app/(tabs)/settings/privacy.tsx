import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { ContactSection, PrivacyDocumentsSection } from '@/components/privacy-sections';
import { SettingsRow, SettingsSection } from '@/components/settings-list';
import { authClient } from '@/lib/auth-client';
import { type Colors, space, useThemedStyles } from '@/theme';

/**
 * Hesap ve gizlilik: every right in one place (#40, story 14). Library export
 * and account deletion keep their places until their tickets fill them.
 */
export default function PrivacySettingsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PrivacyDocumentsSection />
      <SettingsSection title={t('privacy.accountSection')}>
        <SettingsRow
          label={t('privacy.email')}
          value={session?.user.email}
          onPress={() => router.push('/settings/email')}
        />
        <SettingsRow label={t('privacy.export')} />
        <SettingsRow label={t('privacy.deleteAccount')} />
      </SettingsSection>
      <ContactSection />
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg },
  });
