import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CodeInput } from '@/components/code-input';
import { PrimaryButton } from '@/components/primary-button';
import { authClient } from '@/lib/auth-client';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

type Step = { kind: 'address' } | { kind: 'code'; newEmail: string } | { kind: 'done'; newEmail: string };

/** The API's error code for an address another Account already has (apps/api/src/auth.ts). */
const EMAIL_TAKEN = 'EMAIL_TAKEN';
/** Better Auth's error code for text that is not an email address. */
const INVALID_EMAIL = 'INVALID_EMAIL';

/**
 * E-posta değiştirme: a code goes to the new address and the old one is told
 * afterwards, so a scholar keeps their Library when their institution's
 * address closes (#40, story 10).
 */
export default function EmailChangeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { data: session, refetch } = authClient.useSession();
  const currentEmail = session?.user.email ?? '';
  const [step, setStep] = useState<Step>({ kind: 'address' });
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function sendFailure(code: string | undefined) {
    if (code === EMAIL_TAKEN) return t('emailChange.errors.taken');
    if (code === INVALID_EMAIL) return t('emailChange.errors.invalid');
    return t('emailChange.errors.sendFailed');
  }

  async function sendCode(address: string) {
    setError(null);
    // Better Auth compares addresses lower-cased.
    // eslint-disable-next-line no-restricted-syntax -- must match Better Auth's own toLowerCase()
    if (address.toLowerCase() === currentEmail.toLowerCase()) return setError(t('emailChange.errors.same'));
    setBusy(true);
    const { error: failed } = await authClient.emailOtp.requestEmailChange({ newEmail: address });
    setBusy(false);
    if (failed) return setError(sendFailure(failed.code));
    setCode('');
    setStep({ kind: 'code', newEmail: address });
  }

  async function submitCode(address: string) {
    setBusy(true);
    setError(null);
    const { error: failed } = await authClient.emailOtp.changeEmail({ newEmail: address, otp: code });
    setBusy(false);
    if (failed) return setError(t('emailChange.errors.invalidCode'));
    setStep({ kind: 'done', newEmail: address });
    // Better Auth's client does not refetch the session after this call by itself.
    await refetch();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {step.kind === 'address' ? (
        <>
          <Text style={styles.lead}>{t('emailChange.current', { email: currentEmail })}</Text>
          <Text style={styles.lead}>{t('emailChange.lead')}</Text>
          <Text style={styles.label}>{t('emailChange.newLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor={styles.placeholder.color}
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder={t('signIn.emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            autoFocus
            onSubmitEditing={() => newEmail.trim() && sendCode(newEmail.trim())}
          />
          <Text style={styles.hint}>{t('signIn.durableAddressHint')}</Text>
          <View style={styles.action}>
            <PrimaryButton
              label={t('emailChange.sendCode')}
              busy={busy}
              disabled={!newEmail.trim()}
              onPress={() => sendCode(newEmail.trim())}
            />
          </View>
        </>
      ) : null}

      {step.kind === 'code' ? (
        <>
          <Text style={styles.lead}>{t('emailChange.codeSentTo', { email: step.newEmail })}</Text>
          <Text style={styles.label}>{t('emailChange.codeLabel')}</Text>
          <CodeInput value={code} onChange={setCode} onSubmit={() => submitCode(step.newEmail)} />
          <View style={styles.action}>
            <PrimaryButton
              label={t('emailChange.submit')}
              busy={busy}
              disabled={code.length !== 6}
              onPress={() => submitCode(step.newEmail)}
            />
          </View>
          <View style={styles.links}>
            <Pressable onPress={() => sendCode(step.newEmail)} disabled={busy}>
              <Text style={styles.link}>{t('emailChange.resend')}</Text>
            </Pressable>
            <Pressable onPress={() => setStep({ kind: 'address' })} disabled={busy}>
              <Text style={styles.link}>{t('emailChange.otherAddress')}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {step.kind === 'done' ? <Text style={styles.lead}>{t('emailChange.done', { email: step.newEmail })}</Text> : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { alignSelf: 'center', width: '100%', maxWidth: 480, padding: space.lg, gap: space.sm },
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
    hint: { ...typeScale.caption, color: c.muted },
    action: { marginTop: space.md },
    links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md },
    link: { ...typeScale.label, color: c.accent },
    error: { ...typeScale.label, color: c.warn, marginTop: space.sm },
    placeholder: { color: c.muted2 },
  });
