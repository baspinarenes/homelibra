import { formatDate } from '@homelibra/core/date';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { StatusSectionHeader } from '@/components/reading-status';
import { Segment } from '@/components/segment';
import { SourceCover } from '@/components/source-cover';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type Sort = 'title' | 'author' | 'date';

/**
 * Kaynaklar: every Source, by Başlık, Yazar or Tarih, in two sections by
 * Reading status: Okunuyor, then Bitti, folded until opened. A row opens
 * the Source page, where its Notes are captured.
 */
export default function SourcesScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const [sort, setSort] = useState<Sort>('title');
  const [finishedOpen, setFinishedOpen] = useState(false);
  // Keep the rows on screen while the other order loads.
  const sources = useQuery({ ...trpc.sources.list.queryOptions({ sort }), placeholderData: keepPreviousData });
  const addSource = () => router.push('/source/new');

  if (sources.isPending || sources.isError) {
    return (
      <View style={styles.center}>
        {sources.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : (
          <Text style={styles.lead}>{t('sources.loadFailed')}</Text>
        )}
      </View>
    );
  }

  if (sources.data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('sources.emptyTitle')}</Text>
        <Text style={styles.lead}>{t('sources.emptyLead')}</Text>
        <View style={styles.action}>
          <PrimaryButton label={t('sources.add')} onPress={addSource} />
        </View>
      </View>
    );
  }

  const reading = sources.data.filter((source) => source.readingStatus === 'reading');
  const finished = sources.data.filter((source) => source.readingStatus === 'finished');
  const sections = [
    ...(reading.length > 0 ? [{ status: 'reading' as const, count: reading.length, data: reading }] : []),
    ...(finished.length > 0
      ? [{ status: 'finished' as const, count: finished.length, data: finishedOpen ? finished : [] }]
      : []),
  ];

  return (
    <SectionList
      style={styles.screen}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(source) => source.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) =>
        section.status === 'reading' ? (
          <StatusSectionHeader label={t('readingStatus.readingSection')} count={section.count} />
        ) : (
          <StatusSectionHeader
            label={t('readingStatus.finishedSection')}
            count={section.count}
            open={finishedOpen}
            onToggle={() => setFinishedOpen((open) => !open)}
          />
        )
      }
      ListHeaderComponent={
        <View style={styles.sort}>
          <Segment
            label={t('sources.sortLabel')}
            options={[
              { value: 'title', label: t('sources.byTitle') },
              { value: 'author', label: t('sources.byAuthor') },
              { value: 'date', label: t('sources.byDate') },
            ]}
            value={sort}
            onChange={setSort}
          />
        </View>
      }
      renderItem={({ item: source, index }) => {
        // Yazar · Tarih, the Date as it was entered.
        const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
            style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
          >
            <SourceCover type={source.type} cover={source.cover} />
            <View style={styles.text}>
              <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {source.title}
              </Text>
              {byline !== '' && (
                <Text style={styles.byline} numberOfLines={1}>
                  {byline}
                </Text>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
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
    sort: { paddingVertical: space.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    pressed: { opacity: 0.7 },
    text: { flex: 1, gap: 2 },
    type: { ...typeScale.micro, color: c.muted },
    rowTitle: { ...typeScale.sourceTitleSm, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
  });
