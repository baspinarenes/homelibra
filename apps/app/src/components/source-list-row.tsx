import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SourceCover } from '@/components/source-cover';
import { elapsed } from '@/lib/elapsed';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type ListedSource = inferRouterOutputs<AppRouter>['sources']['list'][number];

/**
 * A Kaynaklar row (#40, story 165): Cover, type, Başlık, Yazar · Tarih, then
 * the Note count · when the last Note came ("notsuz" without one), and
 * "N etiketsiz" when Düzenle waits on some. It opens the Source page.
 */
export function SourceListRow({ source, divided }: { source: ListedSource; divided: boolean }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  // Yazar · Tarih, the Date as it was entered.
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  const notes = source.lastNoteAt
    ? `${t('sourceList.notes', { count: source.noteCount })} · ${elapsed(t, source.lastNoteAt)}`
    : t('sourceList.noNotes');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
      style={({ pressed }) => [styles.row, divided && styles.divided, pressed && styles.pressed]}
    >
      <SourceCover type={source.type} cover={source.cover} />
      <View style={styles.text}>
        <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {source.title}
        </Text>
        {byline !== '' && (
          <Text style={styles.byline} numberOfLines={1}>
            {byline}
          </Text>
        )}
        <View style={styles.counts}>
          <Text style={styles.byline}>{notes}</Text>
          {source.untaggedCount > 0 && (
            <Text style={styles.untagged}>{t('organize.untagged', { count: source.untaggedCount })}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    pressed: { opacity: 0.7 },
    text: { flex: 1, gap: 2 },
    type: { ...typeScale.micro, color: c.muted },
    title: { ...typeScale.sourceTitleSm, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
    counts: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: space.sm },
    untagged: { ...typeScale.caption, color: c.warn },
  });
