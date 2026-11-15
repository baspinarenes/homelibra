import { NOT_INVITED } from '@homelibra/core/errors';
import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { InviteNotice } from '@/features/account/invite-notice';
import { authClient } from '@/lib/auth-client';

type Message = { kind: 'notInvited' } | { kind: 'sendFailed' } | { kind: 'invalidCode' } | null;

/**
 * E-posta ile giriş: one screen. Once a code is sent, its field opens below
 * the address, which stays editable; changing the address closes it again.
 * On a wide screen it is Giriş 4's white column (#184), with no header: its
 * way back to Giriş stands above the title.
 */
export default function EmailSignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const wide = useWideLayout().tier === 'wide';
  const headerHeight = useHeaderHeight();
  const [email, setEmail] = useState('');
  // The address the code went to; the code field shows while it is the one typed.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  function editEmail(value: string) {
    setEmail(value);
    if (sentTo !== null && value.trim() !== sentTo) {
      setSentTo(null);
      setCode('');
      setMessage(null);
    }
  }

  function editCode(value: string) {
    setCode(value);
    if (message?.kind === 'invalidCode') setMessage(null);
  }

  async function sendCode(address: string) {
    setBusy(true);
    setMessage(null);
    // With no connection the request throws rather than returning an error.
    const { error } = await authClient.emailOtp
      .sendVerificationOtp({ email: address, type: 'sign-in' })
      .catch(() => ({ error: { code: undefined } }));
    setBusy(false);
    if (error) return setMessage({ kind: error.code === NOT_INVITED ? 'notInvited' : 'sendFailed' });
    setCode('');
    setSentTo(address);
  }

  async function submitCode(address: string) {
    setBusy(true);
    setMessage(null);
    // On success the session store updates and the root layout swaps to the tabs.
    const { error } = await authClient.signIn.emailOtp({ email: address, otp: code });
    setBusy(false);
    if (error) setMessage({ kind: 'invalidCode' });
  }

  const address = email.trim();

  return (
    <KeyboardAvoidingView
      className={wide ? 'flex-1 bg-surface' : 'flex-1 bg-page'}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        contentContainerClassName={
          wide
            ? 'w-[340px] grow justify-center self-center gap-4 py-xl'
            : 'w-full max-w-[420px] self-center gap-4 px-5.5 pt-2 pb-6'
        }
        keyboardShouldPersistTaps="handled"
      >
        {wide ? (
          <Text
            variant="link"
            role="link"
            className="self-start"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
          >
            {t('signIn.back')}
          </Text>
        ) : null}
        <Text variant="title">{t('signIn.emailTitle')}</Text>
        <Text variant="body">{sentTo ? t('signIn.codeSentTo', { email: sentTo }) : t('signIn.lead')}</Text>
        <TextField
          label={t('signIn.emailLabel')}
          value={email}
          onChangeText={editEmail}
          placeholder={t('signIn.emailPlaceholder')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
          autoFocus
          onSubmitEditing={() => !sentTo && address && sendCode(address)}
        />
        {sentTo ? (
          <>
            {/* Mounts as the code is sent, so it takes the focus from the address. */}
            <TextField
              label={t('signIn.codeLabel')}
              code
              value={code}
              onChangeText={editCode}
              autoFocus
              error={message?.kind === 'invalidCode' ? t('signIn.errors.invalidCode') : undefined}
              onSubmitEditing={() => code.length === 6 && submitCode(sentTo)}
            />
            <Button
              label={t('signIn.submit')}
              block
              busy={busy}
              disabled={code.length !== 6}
              onPress={() => submitCode(sentTo)}
            />
            <Button label={t('signIn.resend')} variant="text" disabled={busy} onPress={() => sendCode(sentTo)} />
          </>
        ) : (
          <Button
            label={t('signIn.sendCode')}
            block
            busy={busy}
            disabled={!address}
            onPress={() => sendCode(address)}
          />
        )}
        {message?.kind === 'sendFailed' ? (
          <Text variant="label" color="danger">
            {t('signIn.errors.sendFailed')}
          </Text>
        ) : null}
        {message?.kind === 'notInvited' ? <InviteNotice /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
