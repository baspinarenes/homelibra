import type { AppRouter } from '@homelibra/api';
import { locatorGroups } from '@homelibra/core/note';
import { useQuery } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
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
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

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
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('capture.chooseSource')}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.sourceButton, pressed && styles.pressed]}
    >
      <Text style={styles.sourceType}>{t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}</Text>
      <View style={styles.sourceTitleRow}>
        <Text style={styles.sourceTitle} numberOfLines={1}>
          {source.title}
        </Text>
        <ChevronDown color={colors.muted} size={16} strokeWidth={1.8} />
      </View>
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
  const list = useRef<FlatList<FlowRow>>(null);

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
      style={styles.screen}
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
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.lead}>{t('capture.empty')}</Text>}
          renderItem={({ item: row }) =>
            row.kind === 'heading' ? (
              <Text style={[styles.heading, !row.locator && styles.headingNone]}>
                {row.locator ?? t('capture.noLocator')}
              </Text>
            ) : (
              <FlowNoteView note={row.note} />
            )
          }
        />
      )}
      <NoteComposer
        sourceId={sourceId}
        carriedLocator={flow.data.at(-1)?.locator ?? ''}
        expanded={expanded}
        onExpandedChange={setExpanded}
      />
    </KeyboardAvoidingView>
  );
}

function FlowNoteView({ note }: { note: FlowNote }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.note}>
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
    sourceButton: { maxWidth: 260 },
    sourceType: { ...typeScale.micro, color: c.muted },
    sourceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    sourceTitle: { ...typeScale.sourceTitleSm, color: c.fg, flexShrink: 1 },
    flow: { paddingHorizontal: space.lg, paddingBottom: space.lg },
    emptyFlow: { flexGrow: 1, justifyContent: 'center', padding: space.xl },
    heading: { ...typeScale.locator, color: c.muted, paddingTop: space.lg, paddingBottom: space.xs },
    headingNone: { fontFamily: typeScale.label.fontFamily },
    note: { gap: 6, paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: c.lineSoft },
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      backgroundColor: c.lineSoft,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    comment: { ...typeScale.body, color: c.fg },
  });
