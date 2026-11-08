import { NOT_INVITED } from '@homelibra/core/errors';
import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, useThemedStyles } from '@homelibra/ui/theme';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { InviteNotice } from '@/components/invite-notice';
import { authClient } from '@/lib/auth-client';

type Message = { kind: 'notInvited' } | { kind: 'sendFailed' } | { kind: 'invalidCode' } | null;

/**
 * E-posta ile giriş: one screen. Once a code is sent, its field opens below
 * the address, which stays editable; changing the address closes it again.
 */
export default function EmailSignInScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
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
      style={styles.page}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: c.page },
    content: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 420,
      gap: 16,
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 24,
    },
  });
