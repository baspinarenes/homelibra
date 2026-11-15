import { deletionDueAt } from '@homelibra/core/account';
import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { SafeAreaView } from '@/components/safe-area-view';
import { SignOutButton } from '@/features/account/sign-out-button';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/lib/trpc';

// Uniwind reads className only on React Native's own components.

/**
 * A closed Account signed in again within its 14 days (#40, story 20): the
 * Library stays shut until the scholar cancels the deletion, and then opens
 * exactly as it was. On a wide screen it is one 440 px column in the middle
 * of the window (#184).
 */
export default function AccountClosedScreen() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const wide = useWideLayout().tier === 'wide';
  const { data: session, refetch } = authClient.useSession();
  // Once the session says the Account is open again, the root layout opens the tabs.
  const restore = useMutation(trpc.account.cancelDeletion.mutationOptions({ onSuccess: () => refetch() }));
  const requestedAt = session?.user.deletionRequestedAt;
  const date = requestedAt
    ? deletionDueAt(new Date(requestedAt)).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <SafeAreaView className="flex-1 bg-page">
      <ScrollView
        contentContainerClassName={
          wide
            ? 'w-full max-w-[440px] grow justify-center self-center px-gutter py-xl gap-lg'
            : 'w-full max-w-[520px] self-center px-gutter pt-10 pb-xl gap-lg'
        }
      >
        <Text variant="display">{t('accountClosed.title')}</Text>
        <Text variant="body">{t('accountClosed.lead', { date })}</Text>
        <View className="mt-sm">
          <Button label={t('accountClosed.restore')} block busy={restore.isPending} onPress={() => restore.mutate()} />
        </View>
        {restore.isError ? (
          <Text variant="label" color="warn">
            {t('accountClosed.failed')}
          </Text>
        ) : null}
        {/* The button carries its own padding; pull it back to the gutter. */}
        <View className="-ml-xs self-start">
          <SignOutButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
