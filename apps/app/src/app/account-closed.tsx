import { deletionDueAt } from '@homelibra/core/account';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SignOutButton } from '@/components/sign-out-button';
import { authClient } from '@/lib/auth-client';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

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
        <Text style={styles.title}>{t('accountClosed.title')}</Text>
        <Text style={styles.lead}>{t('accountClosed.lead', { date })}</Text>
        <View style={styles.action}>
          <PrimaryButton label={t('accountClosed.restore')} busy={restore.isPending} onPress={() => restore.mutate()} />
        </View>
        {restore.isError ? <Text style={styles.error}>{t('accountClosed.failed')}</Text> : null}
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
      padding: space.xl,
      gap: space.md,
    },
    title: { ...typeScale.display, color: c.fg },
    lead: { ...typeScale.body, color: c.ink2 },
    action: { marginTop: space.md },
    error: { ...typeScale.label, color: c.warn },
    // The button carries its own padding; pull it back to the gutter.
    signOut: { alignSelf: 'flex-start', marginLeft: -space.md, marginTop: space.sm },
  });
