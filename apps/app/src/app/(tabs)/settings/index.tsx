import { Section, Sections, SectionText } from '@homelibra/ui/section-heading';
import { Segment } from '@homelibra/ui/segment';
import { SettingsRow, SettingsRows } from '@homelibra/ui/settings-row';
import { Text } from '@homelibra/ui/text';
import {
  type Colors,
  setThemePreference,
  space,
  type ThemePreference,
  useThemedStyles,
  useThemePreference,
} from '@homelibra/ui/theme';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ContactSection, PrivacyDocumentsSection } from '@/components/privacy-sections';
import { SignOutButton } from '@/components/sign-out-button';
import { authClient } from '@/lib/auth-client';
import {
  type HomeDivider,
  type LastNotedLayout,
  setHomeDivider,
  setLastNotedLayout,
  setSourceSearchPlace,
  type SourceSearchPlace,
  useHomeDivider,
  useLastNotedLayout,
  useSourceSearchPlace,
} from '@/lib/appearance-choices';

/**
 * Ayarlar, on one page (#113): the theme, how Genel Bakış looks and where a Source's search starts, the Account's own pages (address,
 * export, deletion) with sign-out under them (#140), the privacy documents,
 * contact, and the app's version as a section of its own. Every right of #40 (story 14) is one tap away.
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
  const sourceSearchPlace = useSourceSearchPlace();
  const sourceSearchPlaces: { value: SourceSearchPlace; label: string }[] = [
    { value: 'header', label: t('settings.sourceSearchHeader') },
    { value: 'notes', label: t('settings.sourceSearchNotes') },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Sections>
        <Section title={t('settings.appearance')}>
          <View style={styles.theme}>
            <Text variant="body" color="fg">
              {t('settings.themeLabel')}
            </Text>
            <Segment
              label={t('settings.themeLabel')}
              options={themes}
              value={preference}
              onChange={setThemePreference}
            />
          </View>
          <View style={styles.theme}>
            <Text variant="body" color="fg">
              {t('settings.lastNotedLabel')}
            </Text>
            <Segment
              label={t('settings.lastNotedLabel')}
              options={lastNotedLayouts}
              value={lastNotedLayout}
              onChange={setLastNotedLayout}
            />
          </View>
          <View style={styles.theme}>
            <Text variant="body" color="fg">
              {t('settings.dividerLabel')}
            </Text>
            <Segment
              label={t('settings.dividerLabel')}
              options={homeDividers}
              value={homeDivider}
              onChange={setHomeDivider}
            />
          </View>
          <View style={styles.theme}>
            <Text variant="body" color="fg">
              {t('settings.sourceSearchLabel')}
            </Text>
            <Segment
              label={t('settings.sourceSearchLabel')}
              options={sourceSearchPlaces}
              value={sourceSearchPlace}
              onChange={setSourceSearchPlace}
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
        <Section title={t('settings.versionSection')} spacing="text">
          <SectionText>{Constants.expoConfig?.version}</SectionText>
        </Section>
      </Sections>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.lg },
    theme: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
    signOut: { marginTop: space.lg },
  });
