import { useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import Maximize2 from 'lucide-react-native/icons/maximize-2';
import Minimize2 from 'lucide-react-native/icons/minimize-2';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputInstance,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uuidv7 } from 'uuidv7';

import { Segment } from '@/components/segment';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type Mode = 'excerpt' | 'comment';

const minInputHeight = 66;
const maxInputHeight = 220;

/**
 * Capture's one writing box. Alıntı or Yorum; the Locator carried over from
 * the previous Note sits above it. Enter is a new line: only the button
 * saves, so a long Excerpt is never cut in two by accident.
 */
export function NoteComposer({
  sourceId,
  carriedLocator,
  expanded,
  onExpandedChange,
  onSaved,
}: {
  sourceId: string;
  carriedLocator: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** The Note just saved, so the flow can mark it. */
  onSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('excerpt');
  const [text, setText] = useState('');
  const [locator, setLocator] = useState(carriedLocator);
  const [editingLocator, setEditingLocator] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);
  // The id a failed save used, kept while nothing changes, so sending the
  // same Note again cannot make a second one.
  const attempt = useRef<{ id: string; key: string } | null>(null);

  const create = useMutation(
    trpc.notes.create.mutationOptions({
      onSuccess: async ({ id }) => {
        attempt.current = null;
        onSaved(id);
        setText('');
        onExpandedChange(false);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.notes.flow.queryKey({ sourceId }) }),
          queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() }),
        ]);
      },
    }),
  );

  // Not on blur: on web the blur would remove "Konumsuz" before its press lands.
  const closeLocator = () => {
    setEditingLocator(false);
    inputRef.current?.focus();
  };

  const canSave = text.trim() !== '' && !create.isPending;
  const save = () => {
    if (!canSave) return;
    const note = { sourceId, locator, ...(mode === 'excerpt' ? { excerpt: text } : { comment: text }) };
    const key = JSON.stringify(note);
    if (attempt.current?.key !== key) attempt.current = { id: uuidv7(), key };
    create.mutate({ id: attempt.current.id, ...note });
  };

  // Native multiline inputs grow with their text; a web textarea needs telling.
  useLayoutEffect(() => {
    const node = inputRef.current as unknown as { style: { height: string }; scrollHeight: number } | null;
    if (Platform.OS !== 'web' || !node) return;
    node.style.height = 'auto';
    if (!expanded) node.style.height = `${Math.min(Math.max(node.scrollHeight + 2, minInputHeight), maxInputHeight)}px`;
  }, [text, mode, expanded]);

  return (
    <View style={[styles.composer, { paddingBottom: insets.bottom + space.md }, expanded && styles.composerExpanded]}>
      <View style={styles.controls}>
        {editingLocator ? (
          <View style={styles.locatorEdit}>
            <TextInput
              accessibilityLabel={t('capture.locator')}
              autoFocus
              selectTextOnFocus
              value={locator}
              onChangeText={setLocator}
              onSubmitEditing={closeLocator}
              placeholder={t('capture.locatorPlaceholder')}
              placeholderTextColor={colors.muted2}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              style={styles.locatorInput}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLocator('');
                closeLocator();
              }}
              style={styles.noLocator}
            >
              <Text style={styles.noLocatorText}>{t('capture.noLocator')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={closeLocator} style={styles.noLocator}>
              <Text style={styles.locatorDone}>{t('capture.locatorDone')}</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('capture.locator')}: ${locator.trim() || t('capture.noLocator')}`}
            onPress={() => setEditingLocator(true)}
            style={({ pressed }) => [styles.locatorChip, pressed && styles.pressed]}
          >
            <Text style={locator.trim() ? styles.locatorText : styles.locatorNone} numberOfLines={1}>
              {locator.trim() || t('capture.noLocator')}
            </Text>
          </Pressable>
        )}
        <View style={styles.mode}>
          <Segment
            compact
            label={t('capture.mode')}
            options={[
              { value: 'excerpt', label: t('capture.excerpt') },
              { value: 'comment', label: t('capture.comment') },
            ]}
            value={mode}
            onChange={(next) => {
              setMode(next);
              inputRef.current?.focus();
            }}
          />
        </View>
      </View>

      <View style={[styles.inputRow, expanded && styles.inputRowExpanded]}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={t(`capture.${mode}`)}
          multiline
          onFocus={() => {
            setEditingLocator(false);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          value={text}
          onChangeText={setText}
          placeholder={t(mode === 'excerpt' ? 'capture.excerptPlaceholder' : 'capture.commentPlaceholder')}
          placeholderTextColor={colors.muted2}
          style={[
            styles.input,
            mode === 'excerpt' ? styles.excerpt : styles.comment,
            expanded ? styles.inputExpanded : styles.inputGrowing,
            focused && styles.focused,
          ]}
        />
        <View style={[styles.side, expanded && styles.sideExpanded]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(expanded ? 'capture.collapse' : 'capture.expand')}
            onPress={() => onExpandedChange(!expanded)}
            hitSlop={6}
            style={({ pressed }) => [styles.expand, pressed && styles.pressed]}
          >
            {expanded ? (
              <Minimize2 color={colors.fg} size={15} strokeWidth={1.6} />
            ) : (
              <Maximize2 color={colors.fg} size={15} strokeWidth={1.6} />
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('capture.save')}
            onPress={save}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.send,
              canSave && { boxShadow: shadow.lift },
              !canSave && styles.inactive,
              pressed && styles.pressed,
            ]}
          >
            {create.isPending ? (
              <ActivityIndicator color={colors.accentFg} />
            ) : (
              <ArrowUp color={colors.accentFg} size={20} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>
      {create.isError && <Text style={styles.error}>{t('capture.saveFailed')}</Text>}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // Design system Capture (#68): the box sits on card ground under a rule.
    composer: {
      gap: 9,
      paddingHorizontal: 14,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.surface,
    },
    composerExpanded: { flex: 1, borderTopWidth: 0 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    locatorChip: {
      flexShrink: 1,
      paddingVertical: 4,
      paddingHorizontal: 11,
      borderRadius: radius.chip,
      backgroundColor: c.accentSoft,
    },
    locatorText: { ...typeScale.locator, fontSize: 13, lineHeight: 18, color: c.accent },
    locatorNone: { ...typeScale.label, color: c.accent },
    locatorEdit: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    locatorInput: {
      ...typeScale.locator,
      fontSize: 13,
      color: c.fg,
      width: 150,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: radius.chip,
      backgroundColor: c.page,
    },
    noLocator: { paddingVertical: 5, paddingHorizontal: 4 },
    noLocatorText: { ...typeScale.label, color: c.muted },
    locatorDone: { ...typeScale.button, color: c.accent },
    mode: { marginLeft: 'auto' },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
    inputRowExpanded: { flex: 1, alignItems: 'stretch' },
    input: {
      flex: 1,
      color: c.fg,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.card,
      paddingHorizontal: 13,
      paddingTop: 10,
      paddingBottom: 10,
      textAlignVertical: 'top',
    },
    // Only the accent border, as in the design; no browser focus ring on web.
    focused: { borderColor: c.accent, outlineWidth: 0 },
    inputGrowing: { minHeight: minInputHeight, maxHeight: maxInputHeight },
    inputExpanded: { height: '100%' },
    // The author's words: the quote face on a ground of its own, with the quote rule.
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      backgroundColor: c.lineSoft,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
    },
    comment: { ...typeScale.body, color: c.ink3, backgroundColor: c.page },
    side: { gap: 6, alignItems: 'center' },
    sideExpanded: { justifyContent: 'flex-end' },
    expand: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.pill,
      backgroundColor: c.surface,
    },
    send: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.card,
      backgroundColor: c.accent,
    },
    inactive: { opacity: 0.35 },
    pressed: { opacity: 0.7 },
    error: { ...typeScale.caption, color: c.danger },
  });
