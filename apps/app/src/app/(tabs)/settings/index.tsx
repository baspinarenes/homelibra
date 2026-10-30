import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Segment } from '@/components/segment';
import { SignOutButton } from '@/components/sign-out-button';
import {
  type Colors,
  setThemePreference,
  space,
  type ThemePreference,
  type as typeScale,
  useThemedStyles,
  useThemePreference,
} from '@/theme';

/** A placeholder Ayarlar: the theme choice and sign-out. More settings arrive with their tickets. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const preference = useThemePreference();
  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.heading}>{t('settings.appearance').toLocaleUpperCase('tr')}</Text>
        <Segment label={t('settings.themeLabel')} options={themes} value={preference} onChange={setThemePreference} />
      </View>
      <View style={[styles.section, styles.divided]}>
        <Text style={styles.heading}>{t('settings.account').toLocaleUpperCase('tr')}</Text>
        <View style={styles.signOut}>
          <SignOutButton />
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingVertical: space.sm },
    section: { gap: space.md, paddingVertical: space.lg },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    heading: { ...typeScale.micro, color: c.muted },
    // The button carries its own padding; pull it back to the gutter.
    signOut: { alignSelf: 'flex-start', marginLeft: -space.md },
  });
