import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { RecentTags } from '@/components/recent-tags';
import { SourceCover } from '@/components/source-cover';
import { ToOrganizeStrip } from '@/components/to-organize';
import { elapsed } from '@/lib/elapsed';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type LastNoted = NonNullable<inferRouterOutputs<AppRouter>['sources']['lastNoted']>;

export default function HomeScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const home = useQuery(trpc.sources.home.queryOptions());
  const lastNoted = useQuery(trpc.sources.lastNoted.queryOptions());

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
      </View>
    );
  }

  // The last noted Source heads Ana sayfa; the sections under it come with their tickets.
  if (lastNoted.data) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <LastNotedSection lastNoted={lastNoted.data} />
        <ToOrganizeStrip />
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
          <PrimaryButton label={t('home.takeNote')} onPress={() => router.navigate('/sources')} />
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

/**
 * Son not aldığın (#68, 3rd round): an unboxed section, all of it opening the
 * Source page as for reading; the small "Devam et" opens it ready to write,
 * the box open with the last Locator carried over (#87).
 */
function LastNotedSection({ lastNoted: { source, note } }: { lastNoted: LastNoted }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  const text = note.excerpt ?? note.comment;
  return (
    // Two buttons one under the other: a button may not hold another on web.
    <View style={styles.lastNoted}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
        style={({ pressed }) => [styles.lastNotedBody, pressed && styles.pressed]}
      >
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>{t('home.lastNoted').toLocaleUpperCase('tr')}</Text>
          <Text style={styles.when}>{elapsed(t, note.capturedAt)}</Text>
        </View>
        <View style={styles.identity}>
          <SourceCover type={source.type} cover={source.cover} />
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
            {note.locator && <Text style={styles.locator}>{note.locator}</Text>}
          </View>
        </View>
        {text && (
          <Text style={note.excerpt ? styles.excerpt : styles.comment} numberOfLines={3}>
            {text}
          </Text>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id, write: '1' } })}
        hitSlop={8}
        style={({ pressed }) => [styles.continue, pressed && styles.pressed]}
      >
        <Text style={styles.continueLabel}>{t('home.continue')}</Text>
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
      gap: space.sm,
      backgroundColor: c.page,
    },
    title: { ...typeScale.title, color: c.fg, textAlign: 'center' },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    action: { marginTop: space.lg },
    spinner: { color: c.accent },
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xxl },
    pressed: { opacity: 0.7 },
    lastNoted: { gap: space.sm, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: c.lineSoft },
    lastNotedBody: { gap: space.md },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    sectionLabel: { ...typeScale.micro, color: c.accent },
    when: { ...typeScale.locator, fontSize: 11.5, color: c.muted },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 13 },
    identityText: { flex: 1, gap: 2 },
    type: { ...typeScale.micro, color: c.muted },
    sourceTitle: { ...typeScale.sourceTitleSm, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
    locator: { ...typeScale.locator, color: c.ink2 },
    excerpt: {
      ...typeScale.excerptSm,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
    continue: { alignSelf: 'flex-end', paddingVertical: space.xs, paddingHorizontal: space.sm },
    continueLabel: { ...typeScale.button, color: c.accent },
  });
