import type { AppRouter } from '@homelibra/api';
import { locatorGroups } from '@homelibra/core/note';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NoteComposer } from '@/components/note-composer';
import { type PickableSource, SourcePicker } from '@/components/source-picker';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type FlowNote = inferRouterOutputs<AppRouter>['notes']['flow'][number];
type FlowRow = { kind: 'heading'; key: string; locator: string | null } | { kind: 'note'; key: string; note: FlowNote };

/**
 * Capture (#11, variant C): the chosen Source's Notes, oldest first under
 * their Locators, with one writing box below. Opened from Ana sayfa (the
 * Source last noted in) and from a Source in Kaynaklar. Online only for now.
 */
export default function CaptureScreen() {
  const { sourceId: requested } = useLocalSearchParams<{ sourceId?: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const sources = useQuery(trpc.sources.byLastNote.queryOptions());

  if (sources.isPending || sources.isError) {
    return (
      <View style={styles.center}>
        {sources.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : (
          <Text style={styles.lead}>{t('capture.loadFailed')}</Text>
        )}
      </View>
    );
  }

  // The default is the Source last noted in: the first of the list.
  const source = requested ? sources.data.find((s) => s.id === requested) : sources.data[0];
  if (!source) {
    return (
      <View style={styles.center}>
        <Text style={styles.lead}>{t('capture.noSource')}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: () => <SourceButton source={source} onPress={() => setPicking(true)} /> }}
      />
      {/* A new Source starts with its own flow, Locator and empty box. */}
      <NoteFlow key={source.id} sourceId={source.id} />
      <SourcePicker
        visible={picking}
        sources={sources.data}
        currentId={source.id}
        onClose={() => setPicking(false)}
        onPick={(id) => {
          setPicking(false);
          router.setParams({ sourceId: id });
        }}
      />
    </>
  );
}

/** The Source's name at the top; tapping it opens the Source list. */
function SourceButton({ source, onPress }: { source: PickableSource; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('capture.chooseSource')}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}
    >
      <Text style={styles.sourceType}>{`${t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')} ▾`}</Text>
      <Text style={styles.sourceTitle} numberOfLines={1}>
        {source.title}
      </Text>
    </Pressable>
  );
}

function NoteFlow({ sourceId }: { sourceId: string }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const headerHeight = useHeaderHeight();
  const flow = useQuery(trpc.notes.flow.queryOptions({ sourceId }));
  const [expanded, setExpanded] = useState(false);
  // The Note saved last on this screen wears the accent border.
  const [freshId, setFreshId] = useState<string | null>(null);
  const list = useRef<FlatList<FlowRow>>(null);
  const contentHeight = useRef(0);
  const scrollToBottom = () => list.current?.scrollToOffset({ offset: contentHeight.current, animated: false });

  const rows = useMemo(
    () =>
      locatorGroups(flow.data ?? []).flatMap((group, index): FlowRow[] => [
        { kind: 'heading', key: `heading-${index}`, locator: group.locator },
        ...group.notes.map((note): FlowRow => ({ kind: 'note', key: note.id, note })),
      ]),
    [flow.data],
  );

  if (flow.isPending || flow.isError) {
    return (
      <View style={styles.center}>
        {flow.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : (
          <Text style={styles.lead}>{t('capture.loadFailed')}</Text>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, styles.underHeader]}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={headerHeight}
    >
      {!expanded && (
        <FlatList
          ref={list}
          style={styles.screen}
          contentContainerStyle={rows.length ? styles.flow : styles.emptyFlow}
          data={rows}
          keyExtractor={(row) => row.key}
          keyboardShouldPersistTaps="handled"
          // Newest at the bottom, next to the box, as in a conversation.
          // Also when the list itself shrinks, as the box grows or the keyboard opens.
          // scrollToEnd guesses from unmeasured rows; the content height does not.
          onContentSizeChange={(_, height) => {
            contentHeight.current = height;
            scrollToBottom();
          }}
          onLayout={scrollToBottom}
          ListEmptyComponent={<Text style={styles.lead}>{t('capture.empty')}</Text>}
          renderItem={({ item: row }) =>
            row.kind === 'heading' ? (
              <Text style={styles.heading}>{(row.locator ?? t('capture.noLocator')).toLocaleUpperCase('tr')}</Text>
            ) : (
              <FlowNoteView note={row.note} fresh={row.note.id === freshId} />
            )
          }
        />
      )}
      <NoteComposer
        sourceId={sourceId}
        carriedLocator={flow.data.at(-1)?.locator ?? ''}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onSaved={setFreshId}
      />
    </KeyboardAvoidingView>
  );
}

/** A Note in the flow: the design system's NoteCard, Excerpt above Comment. */
function FlowNoteView({ note, fresh }: { note: FlowNote; fresh: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const { shadow } = useTheme();
  return (
    <View style={[styles.note, { boxShadow: shadow.card }, fresh && styles.fresh]}>
      {note.excerpt && <Text style={styles.excerpt}>{note.excerpt}</Text>}
      {note.comment && <Text style={styles.comment}>{note.comment}</Text>}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: space.xl,
      backgroundColor: c.page,
    },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    spinner: { color: c.accent },
    pressed: { opacity: 0.7 },
    sourceButton: { maxWidth: 280, gap: 1 },
    sourceType: { ...typeScale.micro, color: c.accent },
    sourceTitle: { fontFamily: typeScale.sourceTitle.fontFamily, fontSize: 18, lineHeight: 21, color: c.fg },
    // The header rule from the design: the native header draws none.
    underHeader: { borderTopWidth: 1, borderTopColor: c.line },
    flow: { gap: 10, paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 18 },
    emptyFlow: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
    heading: { ...typeScale.micro, color: c.muted, textAlign: 'center', paddingTop: 10 },
    note: {
      gap: 9,
      paddingVertical: 13,
      paddingHorizontal: 15,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.card,
    },
    fresh: { borderColor: c.accent },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 11,
    },
    comment: { ...typeScale.body, fontSize: 14.5, color: c.ink3 },
  });
