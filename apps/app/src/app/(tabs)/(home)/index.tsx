import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { PrimaryButton } from '@/components/primary-button';
import { useTRPC } from '@/lib/trpc';
import { colors, space } from '@/theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const home = useQuery(trpc.sources.home.queryOptions());

  if (home.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
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

  // The Ana sayfa sections for a Library with Sources arrive with them.
  if (home.data.sourceCount > 0) return <PlaceholderScreen />;

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t('home.emptyTitle')}</Text>
      <Text style={styles.lead}>{t('home.emptyLead')}</Text>
      <View style={styles.action}>
        {/* The Source form arrives in #43. */}
        <PrimaryButton label={t('home.addFirstSource')} onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.sm,
    backgroundColor: colors.page,
  },
  title: { fontSize: 20, fontWeight: '600', color: colors.fg },
  lead: { fontSize: 15, color: colors.muted, textAlign: 'center' },
  action: { marginTop: space.lg },
});
