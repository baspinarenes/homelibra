import { NOT_INVITED } from '@homelibra/core/errors';
import { Button } from '@homelibra/ui/button';
import { AppLogo, GoogleLogo } from '@homelibra/ui/logo';
import { Text } from '@homelibra/ui/text';
import { type Colors, useThemedStyles } from '@homelibra/ui/theme';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InviteNotice } from '@/components/invite-notice';
import { authClient } from '@/lib/auth-client';

type Message = { kind: 'notInvited' } | { kind: 'error'; text: string } | null;

/**
 * Giriş's first screen, on the page itself: the logo, two ways in, and the
 * first layer of the notice, which links to the full notice and the terms.
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  // Google sends a failed sign-in back here as ?error=..., on the web by a
  // redirect and on Android through the app's scheme.
  const { error: googleError } = useLocalSearchParams<{ error?: string }>();
  useEffect(() => {
    if (!googleError) return;
    setMessage(
      googleError === NOT_INVITED ? { kind: 'notInvited' } : { kind: 'error', text: t('signIn.errors.googleFailed') },
    );
  }, [googleError, t]);

  async function continueWithGoogle() {
    setGoogleBusy(true);
    setMessage(null);
    // On success the web leaves for Google; Android opens it in a browser
    // tab and comes back through the app's scheme.
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: Linking.createURL('/'),
      errorCallbackURL: Linking.createURL('/sign-in'),
    });
    setGoogleBusy(false);
    if (error) setMessage({ kind: 'error', text: t('signIn.errors.googleFailed') });
  }

  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <AppLogo size={64} label={t('signIn.logo')} />
          <View style={styles.words}>
            <Text variant="display" style={styles.title}>
              {t('signIn.title')}
            </Text>
            <Text variant="body" style={styles.tagline}>
              {t('signIn.tagline')}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label={t('signIn.withEmail')}
            block
            disabled={googleBusy}
            onPress={() => router.push('/sign-in/email')}
          />
          <Button
            label={t('signIn.google')}
            variant="secondary"
            icon={GoogleLogo}
            block
            busy={googleBusy}
            onPress={continueWithGoogle}
          />
          {message?.kind === 'error' ? (
            <Text variant="label" color="danger" style={styles.error}>
              {message.text}
            </Text>
          ) : null}
          {message?.kind === 'notInvited' ? <InviteNotice /> : null}
          <Text variant="caption" style={styles.legal}>
            <Trans
              i18nKey="signIn.legalNote"
              components={{
                notice: (
                  <Text variant="strong" color="accent" role="link" onPress={() => router.push('/privacy/notice')} />
                ),
                terms: (
                  <Text variant="strong" color="accent" role="link" onPress={() => router.push('/privacy/terms')} />
                ),
              }}
            />
          </Text>
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
      justifyContent: 'center',
      alignSelf: 'center',
      width: '100%',
      maxWidth: 420,
      paddingHorizontal: 22,
      paddingVertical: 24,
    },
    brand: { alignItems: 'center', gap: 20 },
    words: { gap: 8 },
    title: { textAlign: 'center' },
    tagline: { textAlign: 'center' },
    actions: { gap: 12, paddingTop: 40 },
    error: { textAlign: 'center' },
    legal: { textAlign: 'center', paddingTop: 8 },
  });
