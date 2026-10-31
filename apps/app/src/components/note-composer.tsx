import type { SourceType } from '@homelibra/core/source';
import { OperationRefused } from '@homelibra/outbox/trpc';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import Maximize2 from 'lucide-react-native/icons/maximize-2';
import Minimize2 from 'lucide-react-native/icons/minimize-2';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Keyboard,
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

import { LocatorSheet } from '@/components/locator-sheet';
import { Segment } from '@/components/segment';
import { TagPicker } from '@/components/tag-picker';
import { SharedUndoBar } from '@/components/undo-bar';
import { useOutbox } from '@/lib/outbox';
import { offerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

type Mode = 'excerpt' | 'comment';

// One line of an Excerpt: the box rests closed under the Notes while the scholar reads.
const minInputHeight = 47;
const maxInputHeight = 220;

/**
 * After this long with the same Locator, the chip asks "hâlâ burada mı?": a
 * Note tied to the wrong page is Capture's costliest mistake. Five minutes
 * until use on Android says otherwise (#11).
 */
const locatorCheckAfter = 5 * 60_000;

/** As the server keeps it: trimmed, and null when blank. */
const storedLocator = (locator: string) => locator.trim() || null;

/**
 * The writing box at the foot of the Source page, where Notes are captured
 * (#87). Alıntı or Yorum; the Locator carried over from the Note captured
 * last sits above it. Enter is a new line: the button saves, and
 * on the web Ctrl/Cmd+Enter does too, so a long Excerpt is never cut in two by
 * accident. A Comment written right after an Excerpt, at the same Locator,
 * joins that Excerpt's Note.
 */
export function NoteComposer({
  sourceId,
  sourceType,
  carriedLocator,
  carriedSince,
  expanded,
  onExpandedChange,
  autoFocus,
  onFocusChange,
  onSaved,
}: {
  sourceId: string;
  sourceType: SourceType;
  carriedLocator: string;
  /** When the carried Locator was first noted at, in ms; its age starts there. */
  carriedSince: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Opens the box ready to write, as "Devam et" does. */
  autoFocus?: boolean;
  /** The box is open while its text has the focus. */
  onFocusChange: (focused: boolean) => void;
  /** The Note just saved, so the list can show it. */
  onSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors, shadow } = useTheme();
  const insets = useSafeAreaInsets();
  const { apply } = useOutbox();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<'save' | 'attach' | 'undo' | null>(null);
  const [mode, setMode] = useState<Mode>('excerpt');
  const [text, setText] = useState('');
  const [locator, setLocator] = useState(carriedLocator);
  const [locatorSince, setLocatorSince] = useState(carriedSince);
  const [now, setNow] = useState(Date.now);
  const [editingLocator, setEditingLocator] = useState(false);
  // The Tags for the Note being written; untagged is the default, and each save starts untagged again.
  const [tags, setTags] = useState<string[]>([]);
  const [pickingTags, setPickingTags] = useState(false);
  const [focused, setFocused] = useState(false);
  // The Excerpt saved last on this screen, which the next Comment joins.
  const [lastExcerpt, setLastExcerpt] = useState<{ id: string; locator: string | null } | null>(null);
  const inputRef = useRef<TextInputInstance>(null);
  // The id a failed save used, kept while nothing changes, so sending the
  // same Note again cannot make a second one.
  const attempt = useRef<{ id: string; key: string } | null>(null);

  // Android keeps the focus when its keyboard is put away: let the box close
  // with it, so the next tap opens it again (and brings the list back).
  useEffect(() => {
    const hidden = Keyboard.addListener('keyboardDidHide', () => inputRef.current?.blur());
    return () => hidden.remove();
  }, []);

  // A Locator gets old while the screen stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  const stale = locator.trim() !== '' && now - locatorSince > locatorCheckAfter;

  const saved = (id: string) => {
    onSaved(id);
    setText('');
    setTags([]);
    onExpandedChange(false);
  };

  // Geri al after attaching: the Comment becomes a Note of its own, never lost.
  const detach = async (id: string, commentNoteId: string) => {
    setFailure(null);
    try {
      await apply({ type: 'detachComment', id, commentNoteId });
      onSaved(commentNoteId);
    } catch {
      setFailure('undo');
    }
  };

  const attachTo =
    mode === 'comment' && lastExcerpt && lastExcerpt.locator === storedLocator(locator) ? lastExcerpt : null;

  const canSave = text.trim() !== '' && !busy;
  // Through the outbox, which sends now or once the connection returns; the
  // box does not know which. A failure comes back only where there is no
  // outbox (the web).
  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setFailure(null);
    try {
      if (attachTo) {
        const { id } = attachTo;
        // Made now, so the Comment's own Note would sort where it was written.
        // Geri al splits it off with this id; so does the outbox, should the
        // Excerpt's Note no longer take the Comment once it is sent (#58).
        const commentNoteId = uuidv7();
        const ownNote = { id: commentNoteId, sourceId, locator: storedLocator(locator) };
        await apply({ type: 'attachComment', id, comment: text, tags, ownNote });
        saved(id);
        setLastExcerpt(null);
        offerUndo({
          message: t('capture.commentAttached'),
          undo: () => {
            void detach(id, commentNoteId);
            inputRef.current?.focus();
          },
        });
        return;
      }
      const note = { sourceId, locator, tags, ...(mode === 'excerpt' ? { excerpt: text } : { comment: text }) };
      const key = JSON.stringify(note);
      if (attempt.current?.key !== key) attempt.current = { id: uuidv7(), key };
      const { id } = attempt.current;
      await apply({ type: 'createNote', note: { id, ...note } });
      attempt.current = null;
      saved(id);
      if (mode === 'excerpt') {
        setLastExcerpt({ id, locator: storedLocator(locator) });
        setMode('comment');
      } else {
        setLastExcerpt(null);
      }
    } catch (error) {
      // The Note took another Comment or went away elsewhere: the text stays
      // in the box, to be saved as a Note of its own.
      const refused = attachTo && error instanceof OperationRefused;
      if (refused) setLastExcerpt(null);
      setFailure(refused ? 'attach' : 'save');
    } finally {
      setBusy(false);
    }
  };

  // Looking at the Locator, changed or not, starts its age again.
  const confirmLocator = () => {
    const at = Date.now();
    setLocatorSince(at);
    setNow(at);
  };

  const setLocatorFromSheet = (next: string) => {
    setEditingLocator(false);
    // A Comment joins only the Excerpt it follows directly.
    if (storedLocator(next) !== storedLocator(locator)) setLastExcerpt(null);
    setLocator(next);
    confirmLocator();
    inputRef.current?.focus();
  };

  // Native multiline inputs grow with their text; a web textarea needs telling.
  useLayoutEffect(() => {
    const node = inputRef.current as unknown as { style: { height: string }; scrollHeight: number } | null;
    if (Platform.OS !== 'web' || !node) return;
    node.style.height = 'auto';
    if (!expanded) node.style.height = `${Math.min(Math.max(node.scrollHeight + 2, minInputHeight), maxInputHeight)}px`;
  }, [text, mode, expanded]);

  const shownLocator = locator.trim() || t('capture.noLocator');

  return (
    <View style={[styles.composer, { paddingBottom: insets.bottom + space.md }, expanded && styles.composerExpanded]}>
      <SharedUndoBar />
      {attachTo && (
        <View style={styles.attach}>
          <Text style={styles.attachText} numberOfLines={1}>
            {t('capture.attachTo')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLastExcerpt(null);
              inputRef.current?.focus();
            }}
            hitSlop={8}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.attachSeparate}>{t('capture.separateNote')}</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.controls}>
        <View style={styles.locator}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('capture.locator')}: ${shownLocator}${stale ? `, ${t('capture.stillHere')}` : ''}`}
            onPress={() => setEditingLocator(true)}
            style={({ pressed }) => [styles.locatorChip, stale && styles.locatorStale, pressed && styles.pressed]}
          >
            <Text
              style={[locator.trim() ? styles.locatorText : styles.locatorNone, stale && styles.locatorStaleText]}
              numberOfLines={1}
            >
              {stale ? `${shownLocator} · ${t('capture.stillHere')}` : shownLocator}
            </Text>
          </Pressable>
          {stale && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('capture.stillHereConfirmLabel', { locator: shownLocator })}
              onPress={confirmLocator}
              hitSlop={6}
              style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
            >
              <Text style={styles.confirmText}>{t('capture.stillHereConfirm')}</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={tags.length > 0 ? `${t('tags.field')}: ${tags.join(', ')}` : t('tags.add')}
          onPress={() => setPickingTags(true)}
          hitSlop={6}
          style={({ pressed }) => [styles.tags, tags.length > 0 && styles.tagsChosen, pressed && styles.pressed]}
        >
          <Text style={tags.length > 0 ? styles.tagsChosenText : styles.tagsText} numberOfLines={1}>
            {tags.length > 0 ? tags.join(', ') : t('tags.add')}
          </Text>
        </Pressable>
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
              // Going back to Alıntı moves on from the Excerpt just saved.
              if (next === 'excerpt') setLastExcerpt(null);
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
          autoFocus={autoFocus}
          onFocus={() => {
            setFocused(true);
            onFocusChange(true);
          }}
          onBlur={() => {
            setFocused(false);
            onFocusChange(false);
          }}
          value={text}
          onChangeText={setText}
          onKeyPress={(event) => {
            // The web's keyboard event; a phone has no Ctrl or Cmd to hold.
            const key = event as unknown as {
              key: string;
              ctrlKey?: boolean;
              metaKey?: boolean;
              preventDefault: () => void;
            };
            if (Platform.OS !== 'web' || key.key !== 'Enter' || !(key.ctrlKey || key.metaKey)) return;
            key.preventDefault();
            void save();
          }}
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
            onPress={() => {
              // Full screen covers where the bar would sit.
              if (!expanded) offerUndo(null);
              onExpandedChange(!expanded);
            }}
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
            {busy ? (
              <ActivityIndicator color={colors.accentFg} />
            ) : (
              <ArrowUp color={colors.accentFg} size={20} strokeWidth={2} />
            )}
          </Pressable>
        </View>
      </View>
      {failure && (
        <Text style={styles.error}>
          {t(
            failure === 'attach'
              ? 'capture.attachFailed'
              : failure === 'undo'
                ? 'capture.undoFailed'
                : 'capture.saveFailed',
          )}
        </Text>
      )}
      <LocatorSheet
        visible={editingLocator}
        sourceType={sourceType}
        locator={locator.trim()}
        onDone={setLocatorFromSheet}
        onClose={() => setEditingLocator(false)}
        // On the web the closing sheet would take the focus with it.
        onHidden={() => inputRef.current?.focus()}
      />
      <TagPicker
        visible={pickingTags}
        title={t('tags.noteTitle')}
        value={tags}
        onDone={(next) => {
          setPickingTags(false);
          setTags(next);
          inputRef.current?.focus();
        }}
        onClose={() => setPickingTags(false)}
      />
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
    attach: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    attachText: { ...typeScale.caption, flexShrink: 1, color: c.muted },
    attachSeparate: { ...typeScale.caption, fontFamily: typeScale.button.fontFamily, color: c.accent },
    controls: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    locator: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    locatorChip: {
      flexShrink: 1,
      paddingVertical: 4,
      paddingHorizontal: 11,
      borderRadius: radius.chip,
      backgroundColor: c.accentSoft,
    },
    locatorText: { ...typeScale.locator, fontSize: 13, lineHeight: 18, color: c.accent },
    locatorNone: { ...typeScale.label, color: c.accent },
    locatorStale: { backgroundColor: c.warnSoft },
    locatorStaleText: { color: c.warn },
    confirm: {
      paddingVertical: 4,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: c.warn,
      borderRadius: radius.chip,
    },
    confirmText: { ...typeScale.label, color: c.warn },
    // "+ etiket" beside the Locator; once Tags are chosen, their names.
    tags: {
      flexShrink: 1,
      paddingVertical: 3,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: c.line,
      borderStyle: 'dashed',
      borderRadius: radius.chip,
    },
    tagsChosen: { borderStyle: 'solid', borderColor: c.chipBg, backgroundColor: c.chipBg },
    tagsText: { ...typeScale.label, fontSize: 13, color: c.accent },
    tagsChosenText: { ...typeScale.label, fontSize: 13, color: c.chipInk },
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
