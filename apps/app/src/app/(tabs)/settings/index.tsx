import { InlineChoices } from '@homelibra/ui/inline-choices';
import { Section, Sections, SectionText } from '@homelibra/ui/section-heading';
import { Segment } from '@homelibra/ui/segment';
import { SettingsRow, SettingsRows } from '@homelibra/ui/settings-row';
import { Text } from '@homelibra/ui/text';
import { setThemePreference, type ThemePreference, useThemePreference } from '@homelibra/ui/theme';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ContactSection, PrivacyDocumentsSection } from '@/features/privacy/privacy-sections';
import { SettingsPage } from '@/features/account/settings-page';
import { SignOutButton } from '@/features/account/sign-out-button';
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

/** A setting's name and its Segment on one line. */
const choiceRow = 'flex-row items-center justify-between gap-md';

/**
 * Ayarlar, on one page (#113): the theme, how Genel Bakış looks and where a Source's search starts, the Account's own pages (address,
 * export, deletion) with sign-out under them (#140), the privacy documents,
 * contact, and the app's version as a section of its own. Every right of #40 (story 14) is one tap away.
 * On a wide screen one 640 px column (#183): each appearance choice on its row, its options side by side,
 * and Çıkış yap a row of Hesap.
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const wide = useWideLayout().tier === 'wide';
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
    <SettingsPage title={t('tabs.settings')} phone="px-lg pb-lg">
      <Sections wide={wide}>
        <Section title={t('settings.appearance')} spacing={wide ? 'rows' : 'default'}>
          <Choice
            wide={wide}
            label={t('settings.themeLabel')}
            options={themes}
            value={preference}
            onChange={setThemePreference}
          />
          <Choice
            wide={wide}
            label={t('settings.lastNotedLabel')}
            options={lastNotedLayouts}
            value={lastNotedLayout}
            onChange={setLastNotedLayout}
          />
          <Choice
            wide={wide}
            label={t('settings.dividerLabel')}
            options={homeDividers}
            value={homeDivider}
            onChange={setHomeDivider}
          />
          <Choice
            wide={wide}
            label={t('settings.sourceSearchLabel')}
            options={sourceSearchPlaces}
            value={sourceSearchPlace}
            onChange={setSourceSearchPlace}
          />
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
            {/* The text button keeps 4 on each side of its word; this puts the word on the column's edge. */}
            {wide && (
              <View className="-ml-1 min-h-12 items-start justify-center">
                <SignOutButton />
              </View>
            )}
          </SettingsRows>
          {!wide && (
            <View className="mt-lg">
              <SignOutButton block />
            </View>
          )}
        </Section>
        <PrivacyDocumentsSection />
        <ContactSection />
        <Section title={t('settings.versionSection')} spacing="text">
          <SectionText>{Constants.expoConfig?.version}</SectionText>
        </Section>
      </Sections>
    </SettingsPage>
  );
}

/** One appearance choice: its name and a Segment on a phone, its options side by side in the wide column. */
function Choice<T extends string>({
  wide,
  label,
  options,
  value,
  onChange,
}: {
  wide: boolean;
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  if (wide) return <InlineChoices label={label} options={options} value={value} onChange={onChange} />;
  return (
    <View className={choiceRow}>
      <Text variant="body" color="fg">
        {label}
      </Text>
      <Segment label={label} options={options} value={value} onChange={onChange} />
    </View>
  );
}
