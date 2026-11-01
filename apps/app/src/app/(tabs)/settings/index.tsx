import { Section, Sections } from '@homelibra/ui/section-heading';
import { Segment } from '@homelibra/ui/segment';
import { SettingsRow, SettingsRows } from '@homelibra/ui/settings-row';
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
import { SignOutButton } from '@/components/sign-out-button';
import { authClient } from '@/lib/auth-client';
import {
  type HomeDivider,
  type LastNotedLayout,
  setHomeDivider,
  setLastNotedLayout,
  useHomeDivider,
  useLastNotedLayout,
} from '@/lib/home-appearance';

/**
 * Ayarlar, on one page (#113): the theme and how Genel Bakış looks, the Account's own pages (address,
 * export, deletion) with sign-out under them (#140), the privacy documents,
 * contact, and the app's version. Every right of #40 (story 14) is one tap away.
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
  const lastNotedLayout = useLastNotedLayout();
  const lastNotedLayouts: { value: LastNotedLayout; label: string }[] = [
    { value: 'note', label: t('settings.lastNotedNote') },
    { value: 'source', label: t('settings.lastNotedSource') },
  ];
  const homeDivider = useHomeDivider();
  const homeDividers: { value: HomeDivider; label: string }[] = [
    { value: 'rule', label: t('settings.dividerRule') },
    { value: 'band', label: t('settings.dividerBand') },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Sections>
        <Section title={t('settings.appearance')}>
          <View style={styles.theme}>
            <Text style={styles.themeLabel}>{t('settings.themeLabel')}</Text>
            <Segment
              label={t('settings.themeLabel')}
              options={themes}
              value={preference}
              onChange={setThemePreference}
            />
          </View>
          <View style={styles.theme}>
            <Text style={styles.themeLabel}>{t('settings.lastNotedLabel')}</Text>
            <Segment
              label={t('settings.lastNotedLabel')}
              options={lastNotedLayouts}
              value={lastNotedLayout}
              onChange={setLastNotedLayout}
            />
          </View>
          <View style={styles.theme}>
            <Text style={styles.themeLabel}>{t('settings.dividerLabel')}</Text>
            <Segment
              label={t('settings.dividerLabel')}
              options={homeDividers}
              value={homeDivider}
              onChange={setHomeDivider}
            />
          </View>
        </Section>
        <Section title={t('settings.account')} spacing="rows">
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
          <View style={styles.signOut}>
            <SignOutButton block />
          </View>
        </Section>
        <PrivacyDocumentsSection />
        <ContactSection />
        <Text style={styles.version}>{t('settings.appVersion', { version: Constants.expoConfig?.version ?? '' })}</Text>
      </Sections>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
    theme: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
    themeLabel: { ...typeScale.body, color: c.fg },
    signOut: { marginTop: space.lg },
    version: { ...typeScale.caption, color: c.muted, paddingBottom: 18 },
  });
