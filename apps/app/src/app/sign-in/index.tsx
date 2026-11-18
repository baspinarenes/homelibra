import { NOT_INVITED } from '@homelibra/core/errors';
import { Button } from '@homelibra/ui/button';
import { Checkbox } from '@homelibra/ui/checkbox';
import { AppLogo, GoogleLogo } from '@homelibra/ui/logo';
import { Text } from '@homelibra/ui/text';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { SafeAreaView } from '@/components/safe-area-view';
import { InviteNotice } from '@/features/account/invite-notice';
import { authClient } from '@/lib/auth-client';

// Uniwind reads className only on React Native's own components.

type Message = { kind: 'notInvited' } | { kind: 'error'; text: string } | null;

/**
 * Giriş's first screen, on the page itself: the logo, the first layer of the
 * notice, which links to the full notice and the terms, and two ways in, shut
 * until the "okudum" box is ticked (#116). The box is for having read, not a
 * consent: nothing here rests on consent (docs/research/kvkk-obligations.md).
 * On a wide screen it is Giriş 4's white column (#184), beside the intro the
 * sign-in stack draws: a heading for the logo, and at its foot the invitation
 * line and the way to Gizlilik signed out (#40).
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const wide = useWideLayout().tier === 'wide';
  const [hasRead, setHasRead] = useState(false);
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

  const choices = (
    <>
      <Text variant="caption">
        <Trans
          i18nKey="signIn.legalNote"
          components={{
            notice: <Text variant="strong" color="accent" role="link" onPress={() => router.push('/privacy/notice')} />,
            terms: <Text variant="strong" color="accent" role="link" onPress={() => router.push('/privacy/terms')} />,
          }}
        />
      </Text>
      <Checkbox label={t('signIn.hasRead')} checked={hasRead} onChange={setHasRead} />
      <Button
        label={t('signIn.withEmail')}
        block
        disabled={!hasRead || googleBusy}
        onPress={() => router.push('/sign-in/email')}
      />
      <Button
        label={t('signIn.google')}
        variant="secondary"
        icon={GoogleLogo}
        block
        disabled={!hasRead}
        busy={googleBusy}
        onPress={continueWithGoogle}
      />
      {message?.kind === 'error' ? (
        <Text variant="label" color="danger" className="text-center">
          {message.text}
        </Text>
      ) : null}
      {message?.kind === 'notInvited' ? <InviteNotice /> : null}
    </>
  );

  if (wide) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ScrollView contentContainerClassName="w-[340px] grow justify-center self-center gap-3 py-xl">
          <Text variant="title">{t('signIn.heading')}</Text>
          {choices}
          <Text variant="caption" className="mt-0.5">
            {/* The notice below the buttons says it already once an address is turned away. */}
            {message?.kind === 'notInvited' ? null : `${t('signIn.inviteOnly')} · `}
            <Text variant="strong" color="accent" role="link" onPress={() => router.push('/privacy')}>
              {t('signIn.privacyLink')}
            </Text>
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-page">
      <ScrollView contentContainerClassName="w-full max-w-[420px] grow justify-center self-center px-5.5 py-6">
        <View className="items-center gap-5">
          <AppLogo size={64} label={t('signIn.logo')} />
          <View className="gap-2">
            <Text variant="display" className="text-center">
              {t('signIn.title')}
            </Text>
            <Text variant="body" className="text-center">
              {t('signIn.tagline')}
            </Text>
          </View>
        </View>

        <View className="gap-3 pt-10">{choices}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
