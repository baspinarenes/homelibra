import { Button } from '@homelibra/ui/button';
import { Section, Sections } from '@homelibra/ui/section-heading';
import { SettingsRow } from '@homelibra/ui/settings-row';
import { Text } from '@homelibra/ui/text';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { CodeInput } from '@/features/account/code-input';
import { SettingsPage } from '@/features/account/settings-page';
import { authClient } from '@/lib/auth-client';
import { forgetQueries } from '@/lib/query-provider';
import { useTRPC } from '@/lib/trpc';

/**
 * Hesabı sil (#40, story 19): the Library export reminder first, then a
 * code from the Account's address. The code closes the Account at once and
 * signs it out everywhere, so this device lands on the sign-in screen; a
 * sign-in within 14 days offers "Silmeyi iptal et".
 */
export default function AccountDeletionScreen() {
  const { t } = useTranslation();
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
      <SettingsPage title={t('accountDeletion.title')} back phone="w-full max-w-[480px] self-center px-gutter">
        <Sections>
          <Text variant="body" color="fg" className="pt-md pb-4.5">
            {t('accountDeletion.lead')}
          </Text>
          <Section title={t('accountDeletion.exportHeading')}>
            <Text variant="body">{t('accountDeletion.exportLead')}</Text>
            <SettingsRow label={t('libraryExport.title')} onPress={() => router.push('/settings/export')} />
          </Section>
          <View className="gap-2.5 py-4.5">
            <Button
              label={t('accountDeletion.sendCode')}
              variant="danger"
              block
              busy={requestCode.isPending}
              onPress={() => requestCode.mutate()}
            />
            <Button label={t('accountDeletion.cancel')} variant="secondary" block onPress={() => router.back()} />
            {requestCode.isError ? (
              <Text variant="label" color="warn">
                {t('accountDeletion.errors.sendFailed')}
              </Text>
            ) : null}
          </View>
        </Sections>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage
      title={t('accountDeletion.title')}
      back
      phone="w-full max-w-[480px] gap-lg self-center px-gutter pt-md pb-xl"
      gap="lg"
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="body" color="fg">
        {t('accountDeletion.codeSentTo', { email: session?.user.email ?? '' })}
      </Text>
      <View className="gap-1.5">
        <CodeInput
          label={t('accountDeletion.codeLabel')}
          value={code}
          onChange={setCode}
          onSubmit={() => confirm.mutate({ code })}
        />
        {confirm.isError ? (
          <Text variant="caption" color="danger">
            {t('accountDeletion.errors.invalidCode')}
          </Text>
        ) : null}
      </View>
      <Button
        label={t('accountDeletion.submit')}
        variant="danger"
        block
        busy={confirm.isPending}
        disabled={code.length !== 6}
        onPress={() => confirm.mutate({ code })}
      />
      {/* The button keeps 4 on each side of its word; this puts the word on the gutter. */}
      <View className="-ml-1">
        <Button
          label={t('accountDeletion.resend')}
          variant="text"
          disabled={requestCode.isPending || confirm.isPending}
          onPress={() => requestCode.mutate()}
        />
      </View>
      {requestCode.isError ? (
        <Text variant="label" color="warn">
          {t('accountDeletion.errors.sendFailed')}
        </Text>
      ) : null}
    </SettingsPage>
  );
}
