import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { authClient } from '@/lib/auth-client';
import { contactEmail } from '@/lib/contact';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

type Step = { kind: 'email' } | { kind: 'code'; email: string };
type Message = { kind: 'notInvited' } | { kind: 'error'; text: string } | null;

/** The API's error code for an address off the closed-beta list (apps/api/src/auth.ts). */
const NOT_INVITED = 'NOT_INVITED';

export default function SignInScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: 'email' });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  // Google sends a failed sign-in back here as ?error=..., on the web by a
  // redirect and on Android through the app's scheme.
  const { error: googleError } = useLocalSearchParams<{ error?: string }>();
  useEffect(() => {
    if (googleError) setMessage(failure(googleError, t('signIn.errors.googleFailed')));
  }, [googleError, t]);

  /** NOT_INVITED gets the closed-beta notice; anything else gets `text`. */
  function failure(code: string | undefined, text: string): Message {
    return code === NOT_INVITED ? { kind: 'notInvited' } : { kind: 'error', text };
  }

  async function sendCode(address: string) {
    setBusy(true);
    setMessage(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: address, type: 'sign-in' });
    setBusy(false);
    if (error) return setMessage(failure(error.code, t('signIn.errors.sendFailed')));
    setCode('');
    setStep({ kind: 'code', email: address });
  }

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

  async function submitCode(address: string) {
    setBusy(true);
    setMessage(null);
    // On success the session store updates and the root layout swaps to the tabs.
    const { error } = await authClient.signIn.emailOtp({ email: address, otp: code });
    setBusy(false);
    if (error) setMessage({ kind: 'error', text: t('signIn.errors.invalidCode') });
  }

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('signIn.title')}</Text>

          {step.kind === 'email' ? (
            <>
              <Text style={styles.lead}>{t('signIn.lead')}</Text>
              <Text style={styles.label}>{t('signIn.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={styles.placeholder.color}
                value={email}
                onChangeText={setEmail}
                placeholder={t('signIn.emailPlaceholder')}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                inputMode="email"
                onSubmitEditing={() => email.trim() && sendCode(email.trim())}
              />
              <Text style={styles.hint}>{t('signIn.durableAddressHint')}</Text>
              <View style={styles.action}>
                <PrimaryButton
                  label={t('signIn.sendCode')}
                  busy={busy}
                  disabled={!email.trim() || googleBusy}
                  onPress={() => sendCode(email.trim())}
                />
              </View>
              <View style={styles.or}>
                <View style={styles.rule} />
                <Text style={styles.orLabel}>{t('signIn.or')}</Text>
                <View style={styles.rule} />
              </View>
              <SecondaryButton
                label={t('signIn.google')}
                busy={googleBusy}
                disabled={busy}
                onPress={continueWithGoogle}
              />
            </>
          ) : (
            <>
              <Text style={styles.lead}>{t('signIn.codeSentTo', { email: step.email })}</Text>
              <Text style={styles.label}>{t('signIn.codeLabel')}</Text>
              <TextInput
                style={[styles.input, styles.code]}
                placeholderTextColor={styles.placeholder.color}
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                keyboardType="number-pad"
                inputMode="numeric"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={6}
                autoFocus
                onSubmitEditing={() => code.length === 6 && submitCode(step.email)}
              />
              <View style={styles.action}>
                <PrimaryButton
                  label={t('signIn.submit')}
                  busy={busy}
                  disabled={code.length !== 6}
                  onPress={() => submitCode(step.email)}
                />
              </View>
              <View style={styles.links}>
                <Pressable onPress={() => sendCode(step.email)} disabled={busy}>
                  <Text style={styles.link}>{t('signIn.resend')}</Text>
                </Pressable>
                <Pressable onPress={() => setStep({ kind: 'email' })} disabled={busy}>
                  <Text style={styles.link}>{t('signIn.changeEmail')}</Text>
                </Pressable>
              </View>
            </>
          )}

          {message?.kind === 'notInvited' ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>{t('signIn.inviteOnly')}</Text>
              <Text style={styles.hint}>
                {t('signIn.inviteOnlyContact')}{' '}
                <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${contactEmail}`)}>
                  {contactEmail}
                </Text>
              </Text>
            </View>
          ) : null}
          {message?.kind === 'error' ? <Text style={styles.error}>{message.text}</Text> : null}
        </View>
        <Text accessibilityRole="link" style={[styles.link, styles.privacy]} onPress={() => router.push('/privacy')}>
          {t('signIn.privacy')}
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: c.page },
    center: { flex: 1, justifyContent: 'center', padding: space.lg },
    card: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 420,
      backgroundColor: c.surface,
      borderColor: c.line,
      borderWidth: 1,
      borderRadius: radius.card,
      padding: space.xl,
      gap: space.sm,
    },
    title: { ...typeScale.title, color: c.fg, marginBottom: space.sm },
    lead: { ...typeScale.body, color: c.ink2, marginBottom: space.sm },
    label: { ...typeScale.micro, textTransform: 'uppercase', color: c.muted },
    input: {
      borderColor: c.line,
      borderWidth: 1,
      borderRadius: radius.input,
      paddingHorizontal: space.md,
      paddingVertical: space.md,
      ...typeScale.body,
      fontSize: 16,
      color: c.fg,
      backgroundColor: c.surface,
    },
    code: {
      fontFamily: typeScale.locator.fontFamily,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: 8,
      textAlign: 'center',
    },
    hint: { ...typeScale.caption, color: c.muted },
    action: { marginTop: space.md },
    links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
    link: { ...typeScale.label, color: c.accent },
    privacy: { alignSelf: 'center', marginTop: space.lg },
    error: { ...typeScale.label, color: c.warn, marginTop: space.sm },
    or: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginVertical: space.sm },
    rule: { flex: 1, height: 1, backgroundColor: c.line },
    orLabel: { ...typeScale.caption, color: c.muted },
    notice: { gap: space.xs, marginTop: space.sm, borderTopColor: c.line, borderTopWidth: 1, paddingTop: space.md },
    noticeTitle: { ...typeScale.label, color: c.fg },
    placeholder: { color: c.muted2 },
  });
