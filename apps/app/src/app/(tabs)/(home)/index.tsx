import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Button } from '@homelibra/ui/button';
import { SectionHeading } from '@homelibra/ui/section-heading';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LostNotesNotice, useLostNoteCount } from '@/components/lost-notes-notice';
import { ReadingList } from '@/components/reading-list';
import { RecentTags } from '@/components/recent-tags';
import { SourceCover } from '@/components/source-cover';
import { elapsed } from '@/lib/elapsed';
import { useTRPC } from '@/lib/trpc';

type LastNoted = NonNullable<inferRouterOutputs<AppRouter>['sources']['lastNoted']>;

export default function HomeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const home = useQuery(trpc.sources.home.queryOptions());
  const lastNoted = useQuery(trpc.sources.lastNoted.queryOptions());
  const lostNotes = useLostNoteCount();

  if (home.isPending || lastNoted.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={styles.spinner.color} />
      </View>
    );
  }
  if (home.isError || lastNoted.isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.lead}>{t('home.loadFailed')}</Text>
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
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {alerts && (
          <View style={styles.alerts}>
            <LostNotesNotice />
          </View>
        )}
        <LastNotedSection lastNoted={lastNoted.data} afterAlerts={alerts} />
        <ReadingList exceptId={lastNoted.data.source.id} />
        <RecentTags />
      </ScrollView>
    );
  }

  // Sources but no Notes yet: there is no last Source to go on with, so the scholar picks one in Kaynaklar.
  if (home.data.sourceCount > 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.lead}>{t('home.takeNoteLead')}</Text>
        <View style={styles.action}>
          <Button label={t('home.takeNote')} onPress={() => router.navigate('/sources')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t('home.emptyTitle')}</Text>
      <Text style={styles.lead}>{t('home.emptyLead')}</Text>
      <View style={styles.action}>
        <Button label={t('home.addFirstSource')} onPress={() => router.push('/source/new')} />
      </View>
    </View>
  );
}

/**
 * Kaldığın yer (#131): the last noted Source and that Note, unboxed. All of
 * it is one press that opens the Source ready to write, the box open with
 * the last Locator carried over (#87).
 */
function LastNotedSection({
  lastNoted: { source, note },
  afterAlerts,
}: {
  lastNoted: LastNoted;
  afterAlerts: boolean;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const byline = [source.author, source.date && formatDate(source.date), note.locator].filter(Boolean).join(' · ');
  const text = note.excerpt ?? note.comment;
  return (
    <View style={[styles.lastNoted, afterAlerts && styles.lastNotedAfterAlerts]}>
      <SectionHeading title={t('home.lastNoted')} count={elapsed(t, note.capturedAt)} />
      <Pressable
        role="button"
        onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id, write: '1' } })}
        style={({ pressed }) => [styles.lastNotedBody, pressed && styles.pressed]}
      >
        <View style={styles.identity}>
          <SourceCover type={source.type} cover={source.cover} size="large" />
          <View style={styles.identityText}>
            <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
            <Text style={styles.sourceTitle} numberOfLines={2}>
              {source.title}
            </Text>
            {byline !== '' && (
              <Text style={styles.byline} numberOfLines={1}>
                {byline}
              </Text>
            )}
          </View>
        </View>
        {text && (
          <Text style={note.excerpt ? styles.excerpt : styles.comment} numberOfLines={3}>
            {text}
          </Text>
        )}
      </Pressable>
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
      gap: space.md,
      backgroundColor: c.page,
    },
    title: { ...typeScale.title, color: c.fg, textAlign: 'center' },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    action: { marginTop: space.lg },
    spinner: { color: c.accent },
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.gutter, paddingBottom: space.xxl },
    pressed: { opacity: 0.7 },
    alerts: { gap: space.sm, paddingTop: space.xs, paddingBottom: 6 },
    lastNoted: { gap: space.md, paddingTop: space.sm, paddingBottom: 18 },
    lastNotedAfterAlerts: { paddingTop: 14 },
    lastNotedBody: { gap: 14 },
    identity: { flexDirection: 'row', gap: 14 },
    identityText: { flex: 1, minWidth: 0, gap: space.xs },
    type: { ...typeScale.micro, letterSpacing: 1.05, color: c.muted },
    sourceTitle: { ...typeScale.sourceTitleSm, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
    excerpt: {
      ...typeScale.excerptSm,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, color: c.ink2 },
  });
