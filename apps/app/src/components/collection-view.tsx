import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SectionList, StyleSheet, Switch, Text, View } from 'react-native';

import { MarkedText, type Match, type Matches } from '@/components/note-search';
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

/** What a Collection's view and a Tag's page have in common. */
export type ViewData = Pick<
  inferRouterOutputs<AppRouter>['collections']['view'],
  'groups' | 'noteCount' | 'sourceCount' | 'sourceOnlyCount'
>;
type Group = ViewData['groups'][number];
type Note = Group['notes'][number];

/**
 * A Collection's view, or a Tag's page (#12 variant C): the fixed top bar
 * the caller fills, then the Notes grouped by Source in the order the API
 * gives, each Source's heading sticking under the bar while its Notes
 * scroll. The same layout on the phone and the desktop. A Source's heading
 * opens the Source page; a Note opens there, in place. While its search
 * box finds Notes, `matches` marks the words they matched.
 */
export function CollectionView({
  view,
  bar,
  empty,
  matches = null,
}: {
  view: ViewData;
  bar: ReactNode;
  empty: string;
  matches?: Matches | null;
}) {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const sections = view.groups.map((group) => ({ key: group.source.id, source: group.source, data: group.notes }));
  return (
    <View style={styles.screen}>
      <View style={styles.bar}>{bar}</View>
      <SectionList
        style={styles.screen}
        contentContainerStyle={styles.content}
        sections={sections}
        keyExtractor={(note) => note.id}
        extraData={matches}
        stickySectionHeadersEnabled
        ListEmptyComponent={<Text style={styles.empty}>{empty}</Text>}
        renderSectionHeader={({ section }) => (
          <SourceHeading
            source={section.source}
            onPress={() => router.push({ pathname: '/source/[id]', params: { id: section.source.id } })}
          />
        )}
        renderItem={({ item: note, index, section }) => (
          <NoteRow
            note={note}
            match={matches?.get(note.id)}
            divided={index > 0}
            onPress={() => router.push({ pathname: '/source/[id]', params: { id: section.source.id, note: note.id } })}
          />
        )}
      />
    </View>
  );
}

/** Tür, `Yazar, Başlık`, and on the right the Date as entered, or "tarihsiz". */
function SourceHeading({ source, onPress }: { source: Group['source']; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint={t('collection.openSource')}
      onPress={onPress}
      style={({ pressed }) => [styles.heading, pressed && styles.pressed]}
    >
      <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
      <Text style={styles.source} numberOfLines={1}>
        {[source.author, source.title].filter(Boolean).join(', ')}
      </Text>
      <Text style={styles.date}>{source.date ? formatDate(source.date) : t('collection.undated')}</Text>
    </Pressable>
  );
}

/**
 * Locator on the left (— when it has none), Excerpt and ↳ Comment on the
 * right, and under them why the Note is here: its own Tags in the
 * definition, or in another colour the Source's that brought it.
 */
function NoteRow({
  note,
  match,
  divided,
  onPress,
}: {
  note: Note;
  match: Match | undefined;
  divided: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const names = note.why.tags.map((tag) => tag.name).join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('collection.openNote')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divided && styles.divided, pressed && styles.pressed]}
    >
      <Text style={styles.locator}>{note.locator ?? '—'}</Text>
      <View style={styles.texts}>
        {note.excerpt && <MarkedText text={note.excerpt} marks={match?.excerpt} style={styles.excerpt} />}
        {note.comment && <MarkedText text={note.comment} marks={match?.comment} style={styles.comment} prefix="↳ " />}
        {note.why.via === 'note' ? (
          <Text style={styles.why}>{names}</Text>
        ) : (
          <Text style={styles.viaSource}>{t('collection.viaSource', { names })}</Text>
        )}
      </View>
    </Pressable>
  );
}

/** "Etiketli kaynakların tüm notları" and how many Notes only a Source's Tag brings ("+5 not"). */
export function SourceNotesSwitch({
  value,
  count,
  onChange,
}: {
  value: boolean;
  count: number;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.switchRow}>
      <Switch
        accessibilityLabel={t('collection.sourceNotes')}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.line, true: colors.accent }}
        thumbColor={colors.surface}
        // react-native-web colours the thumb of an "on" switch on its own otherwise.
        {...({ activeThumbColor: colors.surface } as object)}
      />
      <Text style={styles.switchLabel}>
        {t('collection.sourceNotes')}{' '}
        <Text style={styles.switchCount}>{t('collection.sourceNotesCount', { count })}</Text>
      </Text>
    </View>
  );
}

/** "N not · M kaynak"; while a search narrows the view, "2 / 15 not · 1 kaynak" against the whole view's `of`. */
export function ViewCount({ view, of }: { view: ViewData; of?: ViewData }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Text style={styles.count}>
      {of && of !== view
        ? t('noteSearch.viewMatchCounts', { shown: view.noteCount, notes: of.noteCount, sources: view.sourceCount })
        : t('collection.counts', { notes: view.noteCount, sources: view.sourceCount })}
    </Text>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    bar: {
      gap: space.sm + 2,
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
      paddingBottom: space.md,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    content: { paddingBottom: space.xxl },
    empty: { ...typeScale.body, color: c.ink2, textAlign: 'center', padding: space.xl },
    pressed: { opacity: 0.7 },
    heading: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: space.sm,
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
      backgroundColor: c.page,
    },
    type: { ...typeScale.micro, color: c.accent },
    source: { ...typeScale.label, flex: 1, minWidth: 0, color: c.fg },
    date: { ...typeScale.caption, color: c.muted },
    row: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm + 2, paddingHorizontal: space.lg },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    locator: { ...typeScale.locator, color: c.muted, width: 72, paddingTop: 3 },
    texts: { flex: 1, gap: 4 },
    excerpt: { ...typeScale.excerpt, fontSize: 15, lineHeight: 23, color: c.quoteInk },
    comment: { ...typeScale.body, fontSize: 14, color: c.ink3 },
    why: { ...typeScale.caption, color: c.chipInk },
    viaSource: { ...typeScale.caption, color: c.warn },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    switchLabel: { ...typeScale.label, flexShrink: 1, color: c.fg },
    switchCount: { color: c.muted },
    count: { ...typeScale.caption, color: c.muted },
  });
