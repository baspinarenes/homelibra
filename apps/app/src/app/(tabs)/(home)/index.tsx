import { Button } from '@homelibra/ui/button';
import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { LastNotedSection } from '@/features/library/last-noted';
import { LibrarySummary } from '@/features/library/library-summary';
import { LostNotesNotice, useLostNoteCount } from '@/features/library/lost-notes-notice';
import { ReadingList } from '@/features/library/reading-list';
import { RecentTags } from '@/features/library/recent-tags';
import { WideOverview } from '@/features/library/wide-overview';
import { useTRPC } from '@/lib/trpc';

/** A message, or the spinner, in the middle of the screen. */
const center = 'flex-1 items-center justify-center gap-md bg-page p-xl';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const trpc = useTRPC();
  const router = useRouter();
  const home = useQuery(trpc.sources.home.queryOptions());
  const lastNoted = useQuery(trpc.sources.lastNoted.queryOptions());
  const lostNotes = useLostNoteCount();
  const wide = useWideLayout().tier === 'wide';
  // On a wide screen the sidebar names the page: no header bar, as the wide board draws it.
  const header = <Stack.Screen options={{ headerShown: !wide }} />;

  if (home.isPending || lastNoted.isPending) {
    return (
      <View className={center}>
        {header}
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (home.isError || lastNoted.isError) {
    return (
      <View className={center}>
        {header}
        <Text variant="body" className="text-center">
          {t('home.loadFailed')}
        </Text>
        {/* The button keeps to its start edge; this box centres it. */}
        <View>
          <Button
            variant="text"
            label={t('home.retry')}
            busy={home.isFetching || lastNoted.isFetching}
            onPress={() => {
              void home.refetch();
              void lastNoted.refetch();
            }}
          />
        </View>
      </View>
    );
  }

  // What waits on the scholar heads Genel Bakış in a yellow strip; then where they left off.
  if (lastNoted.data) {
    if (wide)
      return (
        <>
          {header}
          <WideOverview lastNoted={lastNoted.data} />
        </>
      );
    const alerts = lostNotes > 0;
    return (
      <ScrollView className="flex-1 bg-page" contentContainerClassName="px-gutter pb-xxl">
        {header}
        {alerts && (
          <View className="gap-sm pt-md pb-1.5">
            <LostNotesNotice />
          </View>
        )}
        <LastNotedSection lastNoted={lastNoted.data} afterAlerts={alerts} />
        <ReadingList />
        <RecentTags />
        <LibrarySummary />
      </ScrollView>
    );
  }

  // Sources but no Notes yet: there is no last Source to go on with, so the scholar picks one in Kaynaklar.
  if (home.data.sourceCount > 0) {
    return (
      <View className={center}>
        {header}
        <Text variant="body" className="text-center">
          {t('home.takeNoteLead')}
        </Text>
        <View className="mt-lg">
          <Button label={t('home.takeNote')} onPress={() => router.navigate('/sources')} />
        </View>
      </View>
    );
  }

  return (
    <View className={center}>
      {header}
      <Text variant="title" className="text-center">
        {t('home.emptyTitle')}
      </Text>
      <Text variant="body" className="text-center">
        {t('home.emptyLead')}
      </Text>
      <View className="mt-lg">
        <Button label={t('home.addFirstSource')} onPress={() => router.push('/source/new')} />
      </View>
    </View>
  );
}
