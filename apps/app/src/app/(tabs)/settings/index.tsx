import { Segment } from '@homelibra/ui/segment';
import {
  type Colors,
  setThemePreference,
  space,
  type ThemePreference,
  type as typeScale,
  useThemedStyles,
  useThemePreference,
} from '@homelibra/ui/theme';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContactSection, PrivacyDocumentsSection } from '@/components/privacy-sections';
import { SettingsRow, SettingsRows, SettingsSection } from '@/components/settings-list';
import { SignOutButton } from '@/components/sign-out-button';
import { authClient } from '@/lib/auth-client';

/**
 * Ayarlar, on one page (#113): the theme, the Account's own pages (address,
 * export, deletion), the privacy documents, contact, and sign-out with the
 * app's version under it. Every right of #40 (story 14) is one tap away.
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const preference = useThemePreference();
  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SettingsSection title={t('settings.appearance')} first>
        <View style={styles.theme}>
          <Text style={styles.themeLabel}>{t('settings.themeLabel')}</Text>
          <Segment label={t('settings.themeLabel')} options={themes} value={preference} onChange={setThemePreference} />
        </View>
      </SettingsSection>
      <SettingsSection title={t('settings.account')}>
        <SettingsRows>
          <SettingsRow
            label={t('privacy.email')}
            value={session?.user.email}
            onPress={() => router.push('/settings/email')}
          />
          <SettingsRow label={t('privacy.export')} onPress={() => router.push('/settings/export')} />
          <SettingsRow
            label={t('privacy.deleteAccount')}
            tone="danger"
            onPress={() => router.push('/settings/delete')}
          />
        </SettingsRows>
      </SettingsSection>
      <PrivacyDocumentsSection />
      <ContactSection />
      <View style={styles.signOut}>
        {/* The text button's word sits 4 in; pull it back to the gutter. */}
        <View style={styles.signOutButton}>
          <SignOutButton />
        </View>
        <Text style={styles.version}>{t('settings.appVersion', { version: Constants.expoConfig?.version ?? '' })}</Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
    theme: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
    themeLabel: { ...typeScale.body, color: c.fg },
    signOut: { paddingTop: space.sm, paddingBottom: 18, borderTopWidth: 1, borderTopColor: c.lineSoft },
    signOutButton: { alignSelf: 'flex-start', marginLeft: -space.xs },
    version: { ...typeScale.caption, color: c.muted },
  });
