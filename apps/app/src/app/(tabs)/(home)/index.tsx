import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Button } from '@homelibra/ui/button';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { cx, useTheme } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { LibrarySummary } from '@/features/library/library-summary';
import { LostNotesNotice, useLostNoteCount } from '@/features/library/lost-notes-notice';
import { ReadingList } from '@/features/library/reading-list';
import { RecentTags } from '@/features/library/recent-tags';
import { SourceCover } from '@/features/source/source-cover';
import { elapsed } from '@/features/library/elapsed';
import { useLastNotedLayout } from '@/lib/appearance-choices';
import { useTRPC } from '@/lib/trpc';

type LastNoted = NonNullable<inferRouterOutputs<AppRouter>['sources']['lastNoted']>;

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

  if (home.isPending || lastNoted.isPending) {
    return (
      <View className={center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (home.isError || lastNoted.isError) {
    return (
      <View className={center}>
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
    const alerts = lostNotes > 0;
    return (
      <ScrollView className="flex-1 bg-page" contentContainerClassName="px-gutter pb-xxl">
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

/**
 * Kaldığın yer (#131): the last noted Source and that Note, unboxed, in the
 * layout Ayarlar picks: the Note on top with the Source under it (Not önde),
 * or the Source on top with the Note under it (Kaynak önde). Either way it
 * ends in "Yazmaya devam et ›" and the Locator, and all of it is one press
 * that opens the Source ready to write, the writing sheet up with the last
 * Locator carried over (#87, #157).
 */
function LastNotedSection({
  lastNoted: { source, note },
  afterAlerts,
}: {
  lastNoted: LastNoted;
  afterAlerts: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const layout = useLastNotedLayout();
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  const text = note.excerpt ?? note.comment;
  const noteFirst = layout === 'note';
  // Not önde: the words last written, large and dark, the Source a line under them.
  const noteText = text && (
    <Text
      variant={note.excerpt ? (noteFirst ? 'excerptLg' : 'excerpt') : noteFirst ? 'bodyLg' : 'body'}
      className={note.excerpt && !noteFirst ? 'border-l-2 border-quote-bar pl-2.75' : undefined}
      numberOfLines={noteFirst ? 4 : 3}
    >
      {text}
    </Text>
  );
  const bylineText = byline !== '' && (
    <Text variant="caption" numberOfLines={1}>
      {byline}
    </Text>
  );
  return (
    // 18 under the header's rule, as every Section stands; 14 under the alerts.
    <View className={cx('gap-md pb-5.5', afterAlerts ? 'pt-3.5' : 'pt-4.5')}>
      <SectionHeading title={t('home.lastNoted')} count={elapsed(t, note.capturedAt)} />
      <Pressable
        role="button"
        onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id, write: '1' } })}
        className="gap-3.5 active:opacity-70"
      >
        {noteFirst ? (
          <>
            {noteText}
            <View className="flex-row items-center gap-md">
              <SourceCover type={source.type} cover={source.cover} />
              <View className="min-w-0 flex-1 gap-xs">
                <Text variant="sourceTitleSm" numberOfLines={1}>
                  {source.title}
                </Text>
                {bylineText}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Kaynak önde: the Source as the Source page heads it. */}
            <View className="flex-row gap-3.5">
              <SourceCover type={source.type} cover={source.cover} size="large" />
              <View className="min-w-0 flex-1 gap-xs">
                <Text variant="micro" color="accent">
                  {t(`sourceTypes.${source.type}.label`)}
                </Text>
                {/* The Source Kaldığın yer points to, not a heading: KALDIĞIN YER is the section's. */}
                <Text variant="sourceTitle" role={undefined} numberOfLines={2}>
                  {source.title}
                </Text>
                {bylineText}
              </View>
            </View>
            {noteText}
          </>
        )}
        <View className="flex-row items-baseline justify-between gap-md">
          <Text variant="button">{t('home.goOn')}</Text>
          {note.locator && (
            <Text variant="locator" className="shrink" numberOfLines={1}>
              {note.locator}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}
