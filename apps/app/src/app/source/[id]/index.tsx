import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { TemplateCover } from '@/components/template-cover';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

type ListedNote = inferRouterOutputs<AppRouter>['notes']['list'][number];

/**
 * The Source page (#35): the Source's heading and its Notes in Locator order,
 * with no writing box. "Not al" opens Capture on it; a Note opens its editing.
 * From a search result, `note` names the Note to show in its place, marked.
 */
export default function SourceScreen() {
  const { id, note: shownId } = useLocalSearchParams<{ id: string; note?: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const source = useQuery(trpc.sources.get.queryOptions({ id }));
  const notes = useQuery(trpc.notes.list.queryOptions({ sourceId: id }));
  const list = useRef<FlatList<ListedNote>>(null);
  const retried = useRef(false);
  const shownIndex = notes.data?.findIndex((note) => note.id === shownId) ?? -1;
  useEffect(() => {
    if (shownIndex > 0) list.current?.scrollToIndex({ index: shownIndex, viewPosition: 0.3 });
  }, [shownIndex]);

  if (source.isPending || notes.isPending || source.isError || notes.isError) {
    return (
      <View style={styles.center}>
        {source.isError || notes.isError ? (
          <Text style={styles.lead}>{t('sourcePage.loadFailed')}</Text>
        ) : (
          <ActivityIndicator color={styles.spinner.color} />
        )}
      </View>
    );
  }

  // Yazar · Tarih · Künye notu · not sayısı, the Date as it was entered.
  const byline = [
    source.data.author,
    source.data.date && formatDate(source.data.date),
    source.data.bibliographicNote,
    t('sourcePage.noteCount', { count: notes.data.length }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <FlatList
      ref={list}
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={notes.data}
      keyExtractor={(note) => note.id}
      ListHeaderComponent={
        <View style={styles.heading}>
          <Stack.Screen
            options={{
              title: '',
              headerRight: () => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/source/[id]/edit', params: { id } })}
                  hitSlop={8}
                >
                  <Text style={styles.headerAction}>{t('sourcePage.edit')}</Text>
                </Pressable>
              ),
            }}
          />
          <View style={styles.identity}>
            <TemplateCover type={source.data.type} />
            <View style={styles.identityText}>
              <Text style={styles.type}>{t(`sourceTypes.${source.data.type}.label`).toLocaleUpperCase('tr')}</Text>
              <Text style={styles.title}>{source.data.title}</Text>
            </View>
          </View>
          <Text style={styles.byline}>{byline}</Text>
          <View style={styles.action}>
            <PrimaryButton
              label={t('sourcePage.takeNote')}
              onPress={() => router.push({ pathname: '/capture', params: { sourceId: id } })}
            />
          </View>
        </View>
      }
      // Rows have no fixed height: scroll near it, then once more to it when it is laid out.
      onScrollToIndexFailed={({ index, averageItemLength }) => {
        list.current?.scrollToOffset({ offset: index * averageItemLength });
        if (retried.current) return;
        retried.current = true;
        setTimeout(() => list.current?.scrollToIndex({ index, viewPosition: 0.3 }), 100);
      }}
      ListEmptyComponent={<Text style={styles.empty}>{t('sourcePage.empty')}</Text>}
      renderItem={({ item: note, index }) => (
        <NoteRow
          note={note}
          divided={index > 0}
          shown={note.id === shownId}
          onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
        />
      )}
    />
  );
}

/** Locator on the left (— when it has none), Excerpt and ↳ Comment on the right. */
function NoteRow({
  note,
  divided,
  shown,
  onPress,
}: {
  note: ListedNote;
  divided: boolean;
  /** The Note a search result opened the page on. */
  shown: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('sourcePage.editNote')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, divided && styles.divided, shown && styles.shown, pressed && styles.pressed]}
    >
      <Text style={styles.locator}>{note.locator ?? '—'}</Text>
      <View style={styles.texts}>
        {note.excerpt && <Text style={styles.excerpt}>{note.excerpt}</Text>}
        {note.comment && <Text style={styles.comment}>{`↳ ${note.comment}`}</Text>}
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    headerAction: { ...typeScale.button, fontSize: 15, color: c.accent, paddingHorizontal: space.sm },
    heading: {
      gap: space.md,
      paddingTop: space.sm,
      paddingBottom: 18,
      marginBottom: space.xs,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 13 },
    identityText: { flex: 1, gap: 2 },
    type: { ...typeScale.micro, color: c.accent },
    title: { ...typeScale.sourceTitle, color: c.fg },
    byline: { ...typeScale.caption, color: c.muted },
    action: { alignSelf: 'flex-start' },
    empty: { ...typeScale.body, color: c.ink2, paddingVertical: space.xl, textAlign: 'center' },
    row: { flexDirection: 'row', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    shown: { backgroundColor: c.accentSub, marginHorizontal: -space.lg, paddingHorizontal: space.lg },
    locator: { ...typeScale.locator, color: c.muted, width: 84, paddingTop: 4 },
    texts: { flex: 1, gap: 6 },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
  });
