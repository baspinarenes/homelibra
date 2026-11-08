import { deletionDueAt } from '@homelibra/core/account';
import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignOutButton } from '@/components/sign-out-button';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/lib/trpc';

/**
 * A closed Account signed in again within its 14 days (#40, story 20): the
 * Library stays shut until the scholar cancels the deletion, and then opens
 * exactly as it was.
 */
export default function AccountClosedScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
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
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="display">{t('accountClosed.title')}</Text>
        <Text variant="body">{t('accountClosed.lead', { date })}</Text>
        <View style={styles.action}>
          <Button label={t('accountClosed.restore')} block busy={restore.isPending} onPress={() => restore.mutate()} />
        </View>
        {restore.isError ? (
          <Text variant="label" color="warn">
            {t('accountClosed.failed')}
          </Text>
        ) : null}
        <View style={styles.signOut}>
          <SignOutButton />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: c.page },
    content: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 520,
      paddingTop: 40,
      paddingHorizontal: space.gutter,
      paddingBottom: space.xl,
      gap: space.lg,
    },
    action: { marginTop: space.sm },
    // The button carries its own padding; pull it back to the gutter.
    signOut: { alignSelf: 'flex-start', marginLeft: -space.xs },
  });
