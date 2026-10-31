import type { AppRouter } from '@homelibra/api';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SourceCover } from '@/components/source-cover';
import { elapsed } from '@/lib/elapsed';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type ToOrganize = inferRouterOutputs<AppRouter>['organize']['list'][number];

/** Titles the Ana sayfa strip names before "…". */
const stripTitles = 3;

/** Düzenlenecekler (#13): the Sources with untagged Notes since their last "Bitir". Shared by Ana sayfa, its tab badge and the list. */
export function useToOrganize() {
  const trpc = useTRPC();
  return useQuery(trpc.organize.list.queryOptions());
}

/**
 * Ana sayfa's Düzenlenecekler strip: how many Sources and the first few
 * titles; it opens the list. Nothing while no Source waits.
 */
export function ToOrganizeStrip() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const sources = useToOrganize();
  if (!sources.data?.length) return null;
  const titles = sources.data.slice(0, stripTitles).map((source) => source.title);
  if (sources.data.length > stripTitles) titles.push('…');
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push('/organize')}
      style={({ pressed }) => [styles.strip, pressed && styles.pressed]}
    >
      <View style={styles.head}>
        <Text style={styles.label}>{t('organize.title').toLocaleUpperCase('tr')}</Text>
        <Text style={styles.count}>{t('organize.sources', { count: sources.data.length })} ›</Text>
      </View>
      <Text style={styles.titles} numberOfLines={2}>
        {titles.join(' · ')}
      </Text>
    </Pressable>
  );
}

/**
 * A Düzenlenecekler row: Cover, title, when the last Note came, then "bitti"
 * if so and "N etiketsiz" as chips; it opens the Source page.
 */
export function ToOrganizeRow({ source, divided }: { source: ToOrganize; divided: boolean }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
      style={({ pressed }) => [styles.row, divided && styles.divided, pressed && styles.pressed]}
    >
      <SourceCover type={source.type} cover={source.cover} />
      <View style={styles.rowText}>
        <Text style={styles.title} numberOfLines={2}>
          {source.title}
        </Text>
        <Text style={styles.when}>{elapsed(t, source.lastNoteAt)}</Text>
        <ChipRow>
          {source.finished && <Chip label={t('readingStatus.finished')} tone="done" />}
          <Chip label={t('organize.untagged', { count: source.untaggedCount })} tone="warn" />
        </ChipRow>
      </View>
      <View style={styles.chevron}>
        <ChevronRight size={18} color={colors.muted2} />
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },
    strip: { gap: space.xs, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.lineSoft },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    label: { ...typeScale.micro, color: c.warn },
    count: { ...typeScale.button, color: c.accent },
    titles: { ...typeScale.body, color: c.ink2 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    rowText: { flex: 1, gap: 6 },
    title: { ...typeScale.sourceTitleSm, color: c.fg },
    when: { ...typeScale.heading, letterSpacing: 0, color: c.muted },
    chevron: { alignSelf: 'center' },
  });
