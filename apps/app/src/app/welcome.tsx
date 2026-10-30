import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Checkbox } from '@/components/checkbox';
import { PrimaryButton } from '@/components/primary-button';
import { SignOutButton } from '@/components/sign-out-button';
import { authClient } from '@/lib/auth-client';
import { legalVersion, shortNotice } from '@/lib/legal';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * İlk giriş onayı: shown once per Account, before the Library opens. The
 * short notice and a link to the full text, then the terms of use. There is
 * no consent box: nothing here rests on consent (docs/research/kvkk-obligations.md).
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const trpc = useTRPC();
  const { refetch } = authClient.useSession();
  const [accepted, setAccepted] = useState(false);
  // Once the session says the terms are accepted, the root layout opens the tabs.
  const accept = useMutation(trpc.account.acceptTerms.mutationOptions({ onSuccess: () => refetch() }));

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.lead}>{t('welcome.lead')}</Text>
        {shortNotice.map((paragraph) => (
          <Text key={paragraph} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
        <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/privacy/notice')}>
          {t('welcome.fullNotice')}
        </Text>

        <View style={styles.terms}>
          <Checkbox label={t('welcome.acceptTerms')} checked={accepted} onChange={setAccepted} />
          <Text accessibilityRole="link" style={styles.link} onPress={() => router.push('/privacy/terms')}>
            {t('welcome.readTerms')}
          </Text>
        </View>

        <View style={styles.action}>
          <PrimaryButton
            label={t('welcome.continue')}
            busy={accept.isPending}
            disabled={!accepted}
            onPress={() => accept.mutate({ version: legalVersion })}
          />
        </View>
        {accept.isError ? <Text style={styles.error}>{t('welcome.failed')}</Text> : null}
        <View style={styles.signOut}>
          <SignOutButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: c.page },
    content: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 520,
      padding: space.xl,
      gap: space.md,
    },
    title: { ...typeScale.display, color: c.fg },
    lead: { ...typeScale.body, color: c.ink2 },
    paragraph: { ...typeScale.body, color: c.ink3 },
    link: { ...typeScale.label, color: c.accent, alignSelf: 'flex-start' },
    terms: {
      gap: space.xs,
      marginTop: space.md,
      paddingTop: space.lg,
      borderTopWidth: 1,
      borderTopColor: c.lineSoft,
    },
    action: { marginTop: space.md },
    error: { ...typeScale.label, color: c.warn },
    // The button carries its own padding; pull it back to the gutter.
    signOut: { alignSelf: 'flex-start', marginLeft: -space.md, marginTop: space.sm },
  });
