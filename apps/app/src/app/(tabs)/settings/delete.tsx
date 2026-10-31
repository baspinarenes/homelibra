import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CodeInput } from '@/components/code-input';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { SettingsRow, SettingsSection, SettingsText } from '@/components/settings-list';
import { authClient } from '@/lib/auth-client';
import { forgetQueries } from '@/lib/query-provider';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Hesabı sil (#40, story 19): the Library export reminder first, then a
 * code from the Account's address. The code closes the Account at once and
 * signs it out everywhere, so this device lands on the sign-in screen; a
 * sign-in within 14 days offers "Silmeyi iptal et".
 */
export default function AccountDeletionScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const trpc = useTRPC();
  const { data: session, refetch } = authClient.useSession();
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');

  const requestCode = useMutation(
    trpc.account.requestDeletion.mutationOptions({
      onSuccess: () => {
        setCode('');
        setCodeSent(true);
      },
    }),
  );
  const confirm = useMutation(
    trpc.account.confirmDeletion.mutationOptions({
      // The API has already ended every session; this forgets this device's.
      onSuccess: async () => {
        await authClient.signOut().catch(() => {});
        await forgetQueries();
        await refetch();
      },
    }),
  );

  if (!codeSent) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.lead}>{t('accountDeletion.lead')}</Text>
        <SettingsSection title={t('accountDeletion.exportHeading')}>
          <SettingsText>{t('accountDeletion.exportLead')}</SettingsText>
          <SettingsRow label={t('libraryExport.title')} onPress={() => router.push('/settings/export')} />
        </SettingsSection>
        <View style={styles.actions}>
          <PrimaryButton
            label={t('accountDeletion.sendCode')}
            destructive
            busy={requestCode.isPending}
            onPress={() => requestCode.mutate()}
          />
          <SecondaryButton label={t('accountDeletion.cancel')} onPress={() => router.back()} />
        </View>
        {requestCode.isError ? <Text style={styles.error}>{t('accountDeletion.errors.sendFailed')}</Text> : null}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>{t('accountDeletion.codeSentTo', { email: session?.user.email ?? '' })}</Text>
      {/* Not textTransform: CSS would write SILME for SİLME. */}
      <Text style={styles.label}>{t('accountDeletion.codeLabel').toLocaleUpperCase('tr')}</Text>
      <CodeInput value={code} onChange={setCode} onSubmit={() => confirm.mutate({ code })} />
      <View style={styles.actions}>
        <PrimaryButton
          label={t('accountDeletion.submit')}
          destructive
          busy={confirm.isPending}
          disabled={code.length !== 6}
          onPress={() => confirm.mutate({ code })}
        />
      </View>
      <View style={styles.links}>
        <Pressable onPress={() => requestCode.mutate()} disabled={requestCode.isPending || confirm.isPending}>
          <Text style={styles.link}>{t('accountDeletion.resend')}</Text>
        </Pressable>
      </View>
      {confirm.isError ? <Text style={styles.error}>{t('accountDeletion.errors.invalidCode')}</Text> : null}
      {requestCode.isError ? <Text style={styles.error}>{t('accountDeletion.errors.sendFailed')}</Text> : null}
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { alignSelf: 'center', width: '100%', maxWidth: 480, padding: space.lg, gap: space.sm },
    lead: { ...typeScale.body, color: c.ink2, marginBottom: space.sm },
    label: { ...typeScale.micro, color: c.muted },
    actions: { marginTop: space.md, gap: space.sm },
    links: { flexDirection: 'row', marginTop: space.md },
    link: { ...typeScale.label, color: c.accent },
    error: { ...typeScale.label, color: c.warn, marginTop: space.sm },
  });
