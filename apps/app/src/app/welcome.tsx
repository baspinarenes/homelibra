import { Button } from '@homelibra/ui/button';
import { BookIllustration } from '@homelibra/ui/illustration';
import { Text } from '@homelibra/ui/text';
import { type Colors, space, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation } from '@tanstack/react-query';
import BookOpen from 'lucide-react-native/icons/book-open';
import Download from 'lucide-react-native/icons/download';
import Quote from 'lucide-react-native/icons/quote';
import Tag from 'lucide-react-native/icons/tag';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authClient } from '@/lib/auth-client';
import { legalVersion } from '@/lib/legal';
import { useTRPC } from '@/lib/trpc';

const features = [
  { icon: BookOpen, key: 'welcome.features.sources' },
  { icon: Quote, key: 'welcome.features.notes' },
  { icon: Tag, key: 'welcome.features.tags' },
  { icon: Download, key: 'welcome.features.export' },
] as const;

/**
 * Hoş geldin: Homelibra in a few lines, shown once per Account, before the
 * Library opens. The terms were accepted at sign-in, by the note under
 * Giriş's buttons ("Devam ederek … kabul etmiş olursun"); Başla records that
 * acceptance with the version of the texts (account.acceptTerms), and the
 * Library opens. There is no consent box: nothing here rests on consent
 * (docs/research/kvkk-obligations.md).
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const { refetch } = authClient.useSession();
  // Once the session says the terms are accepted, the root layout opens the tabs.
  const accept = useMutation(trpc.account.acceptTerms.mutationOptions({ onSuccess: () => refetch() }));

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.illustration}>
          <BookIllustration />
        </View>
        <View style={styles.words}>
          <Text variant="display">{t('welcome.title')}</Text>
          <Text variant="body">{t('welcome.lead')}</Text>
        </View>
        <View style={styles.features}>
          {features.map(({ icon: Icon, key }) => (
            <View key={key} style={styles.feature}>
              <View style={styles.icon}>
                <Icon color={colors.accent} size={20} strokeWidth={1.6} />
              </View>
              <Text variant="body" color="ink3" style={styles.featureText}>
                {t(key)}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.action}>
          <Button
            label={t('welcome.start')}
            block
            busy={accept.isPending}
            onPress={() => accept.mutate({ version: legalVersion })}
          />
          {accept.isError ? (
            <Text variant="label" color="warn">
              {t('welcome.failed')}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: c.page },
    content: {
      flexGrow: 1,
      alignSelf: 'center',
      width: '100%',
      maxWidth: 520,
      paddingTop: 40,
      paddingHorizontal: space.gutter,
      paddingBottom: space.xl,
    },
    // The drawing's left page starts 8px inside it; pull it back to the gutter.
    illustration: { marginLeft: -space.sm },
    words: { gap: space.sm, marginTop: 28 },
    features: { gap: 14, marginTop: 28 },
    feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    icon: { marginTop: 1 },
    featureText: { flex: 1 },
    // Pinned to the foot of a tall screen, right after the features on a short one.
    action: { marginTop: 'auto', paddingTop: space.xl, gap: space.md },
  });
