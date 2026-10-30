import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const home = useQuery(trpc.sources.home.queryOptions());

  if (home.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={styles.spinner.color} />
      </View>
    );
  }
  if (home.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.lead}>{t('home.loadFailed')}</Text>
      </View>
    );
  }

  // Capture opens on the Source last noted in. The Ana sayfa sections for a
  // Library with Sources (the last noted Source's card first) arrive with #46.
  if (home.data.sourceCount > 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.lead}>{t('home.takeNoteLead')}</Text>
        <View style={styles.action}>
          <PrimaryButton label={t('home.takeNote')} onPress={() => router.push('/capture')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t('home.emptyTitle')}</Text>
      <Text style={styles.lead}>{t('home.emptyLead')}</Text>
      <View style={styles.action}>
        <PrimaryButton label={t('home.addFirstSource')} onPress={() => router.push('/source/new')} />
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space.xl,
      gap: space.sm,
      backgroundColor: c.page,
    },
    title: { ...typeScale.title, color: c.fg, textAlign: 'center' },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    action: { marginTop: space.lg },
    spinner: { color: c.accent },
  });
