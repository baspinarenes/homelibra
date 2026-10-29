import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { authClient } from '@/lib/auth-client';
import { colors, space } from '@/theme';

type Step = { kind: 'email' } | { kind: 'code'; email: string };

export default function SignInScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>({ kind: 'email' });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(address: string) {
    setBusy(true);
    setError(null);
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: address, type: 'sign-in' });
    setBusy(false);
    if (error) return setError(t('signIn.errors.sendFailed'));
    setCode('');
    setStep({ kind: 'code', email: address });
  }

  async function submitCode(address: string) {
    setBusy(true);
    setError(null);
    // On success the session store updates and the root layout swaps to the tabs.
    const { error } = await authClient.signIn.emailOtp({ email: address, otp: code });
    setBusy(false);
    if (error) setError(t('signIn.errors.invalidCode'));
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
                  disabled={!email.trim()}
                  onPress={() => sendCode(email.trim())}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.lead}>{t('signIn.codeSentTo', { email: step.email })}</Text>
              <Text style={styles.label}>{t('signIn.codeLabel')}</Text>
              <TextInput
                style={[styles.input, styles.code]}
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

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.page },
  center: { flex: 1, justifyContent: 'center', padding: space.lg },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: space.xl,
    gap: space.sm,
  },
  title: { fontSize: 24, fontWeight: '600', color: colors.accent, marginBottom: space.sm },
  lead: { fontSize: 15, color: colors.fg, marginBottom: space.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.fg,
  },
  code: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  hint: { fontSize: 13, color: colors.muted },
  action: { marginTop: space.md },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
  link: { color: colors.accent, fontSize: 14 },
  error: { color: colors.warn, fontSize: 14, marginTop: space.sm },
});
