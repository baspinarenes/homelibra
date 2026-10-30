import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useRouter } from 'expo-router';
import X from 'lucide-react-native/icons/x';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { TemplateCover } from '@/components/template-cover';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type Results = inferRouterOutputs<AppRouter>['search']['library'];
type NoteResult = Results['notes'][number];
type SourceResult = Results['sources'][number];

/** The widest the search box gets on a wide screen. */
const BOX_WIDTH = 640;

/** Sources shown before "Tüm kaynaklar". */
const FIRST_SOURCES = 3;

/**
 * Ara: the whole Library searched by the words of its Notes and Sources
 * (ADR-0005). The box in the top bar sends the query as typed; the server
 * folds, stems, ranks and marks the matching words (ADR-0010).
 */
export default function SearchScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const [text, setText] = useState('');
  const query = useSettled(text.trim());
  const [allSources, setAllSources] = useState(false);
  const results = useInfiniteQuery({
    ...trpc.search.library.infiniteQueryOptions({ query }, { getNextPageParam: (page) => page.nextCursor }),
    enabled: query !== '',
    // Keep the last results on screen while the next query runs.
    placeholderData: keepPreviousData,
  });
  useEffect(() => setAllSources(false), [query]);
  const first = results.data?.pages[0];
  const sources = first?.sources ?? [];
  const notes = results.data?.pages.flatMap((page) => page.notes) ?? [];

  return (
    <>
      <Stack.Screen options={{ headerTitle: () => <SearchBox value={text} onChange={setText} /> }} />
      {query === '' ? (
        <Hint />
      ) : results.isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={styles.spinner.color} />
        </View>
      ) : results.isError ? (
        <View style={styles.center}>
          <Text style={styles.lead}>{t('search.failed')}</Text>
        </View>
      ) : sources.length === 0 && notes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.lead}>{t('search.empty')}</Text>
        </View>
      ) : (
        <FlatList
          style={styles.screen}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          data={notes}
          keyExtractor={(note) => note.id}
          ListHeaderComponent={
            <>
              {sources.length > 0 && (
                <View style={styles.sources}>
                  <GroupHeading label={t('search.sources')} count={sources.length} />
                  {(allSources ? sources : sources.slice(0, FIRST_SOURCES)).map((source, i) => (
                    <SourceRow key={source.id} source={source} divided={i > 0} />
                  ))}
                  {!allSources && sources.length > FIRST_SOURCES && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setAllSources(true)}
                      style={({ pressed }) => [styles.allSources, pressed && styles.pressed]}
                    >
                      <Text style={styles.allSourcesText}>{t('search.allSources', { count: sources.length })}</Text>
                    </Pressable>
                  )}
                </View>
              )}
              {notes.length > 0 && <GroupHeading label={t('search.notes')} count={first?.noteTotal ?? 0} />}
            </>
          }
          renderItem={({ item: note, index }) => <NoteRow note={note} divided={index > 0} />}
          onEndReached={() => {
            if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            results.isFetchingNextPage ? (
              <ActivityIndicator color={styles.spinner.color} style={styles.more} />
            ) : undefined
          }
        />
      )}
    </>
  );
}

/** The text after the scholar stops typing for a moment, so a search does not run on every key. */
function useSettled(value: string, delay = 250) {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

function SearchBox({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  // The header sizes its title to its content: give the box the bar's width,
  // which the header itself caps beside the web's tab rail.
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.box, { width: Math.min(BOX_WIDTH, width - 2 * space.lg) }]}>
      <TextInput
        accessibilityLabel={t('tabs.search')}
        placeholder={t('search.placeholder')}
        placeholderTextColor={colors.muted2}
        value={value}
        onChangeText={onChange}
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value !== '' && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.clear')}
          onPress={() => onChange('')}
          hitSlop={8}
          style={styles.clear}
        >
          <X color={colors.muted} size={18} strokeWidth={1.8} />
        </Pressable>
      )}
    </View>
  );
}

/** What an empty box shows: where search looks, and its two operators. */
function Hint() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.hint}>
      <Text style={styles.hintText}>{t('search.hintScope')}</Text>
      <Text style={styles.hintText}>
        <Text style={styles.code}>{t('search.hintQuoteExample')}</Text> {t('search.hintQuote')} ·{' '}
        <Text style={styles.code}>{t('search.hintExcludeExample')}</Text> {t('search.hintExclude')}
      </Text>
      <Text style={styles.hintText}>{t('search.hintNotSearched')}</Text>
    </View>
  );
}

function GroupHeading({ label, count }: { label: string; count: number }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.group}>{`${label} · ${count}`.toLocaleUpperCase('tr')}</Text>;
}

function SourceRow({ source, divided }: { source: SourceResult; divided: boolean }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  // Yazar · Tarih, the Date as it was entered.
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
      style={({ pressed }) => [styles.sourceRow, divided && styles.divided, pressed && styles.pressed]}
    >
      <TemplateCover type={source.type} />
      <View style={styles.sourceText}>
        <Text style={styles.type}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
        <Text style={styles.sourceTitle} numberOfLines={2}>
          {source.title}
        </Text>
        {byline !== '' && (
          <Text style={styles.meta} numberOfLines={1}>
            {byline}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/** The matching part, marked; then Yazar, Başlık · Konum, and "yorumdan" when the part is from the Comment. */
function NoteRow({ note, divided }: { note: NoteResult; divided: boolean }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const meta = [
    [note.author, note.title].filter(Boolean).join(', '),
    note.locator,
    note.fromComment && t('search.fromComment'),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: note.sourceId, note: note.id } })}
      style={({ pressed }) => [styles.noteRow, divided && styles.divided, pressed && styles.pressed]}
    >
      <Text style={note.fromComment ? styles.comment : styles.excerpt}>
        {note.fromComment && '↳ '}
        {note.snippet.map((segment, i) =>
          segment.hit ? (
            <Text key={i} style={styles.hit}>
              {segment.text}
            </Text>
          ) : (
            segment.text
          ),
        )}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
    sources: { paddingBottom: space.lg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    box: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%' },
    input: {
      ...typeScale.body,
      flex: 1,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingLeft: 12,
      paddingRight: 36,
      paddingVertical: 8,
    },
    clear: { position: 'absolute', right: 10 },
    hint: { flex: 1, gap: space.md, padding: space.lg, backgroundColor: c.page },
    hintText: { ...typeScale.body, color: c.muted },
    code: { ...typeScale.locator, color: c.ink3 },
    group: { ...typeScale.micro, color: c.muted, paddingTop: space.md, paddingBottom: space.sm },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: space.md },
    sourceText: { flex: 1, gap: 2 },
    type: { ...typeScale.micro, color: c.muted },
    sourceTitle: { ...typeScale.sourceTitleSm, color: c.fg },
    allSources: { alignSelf: 'flex-start', paddingVertical: space.sm },
    allSourcesText: { ...typeScale.button, color: c.accent },
    noteRow: { gap: 6, paddingVertical: space.md },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
    hit: { backgroundColor: c.mark, color: c.fg },
    meta: { ...typeScale.caption, color: c.muted },
    more: { paddingVertical: space.md },
  });
