import type { SourceType } from '@homelibra/core/source';
import { OperationRefused } from '@homelibra/outbox/trpc';
import { Segment } from '@homelibra/ui/segment';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import ArrowUp from 'lucide-react-native/icons/arrow-up';
import CornerDownRight from 'lucide-react-native/icons/corner-down-right';
import Maximize2 from 'lucide-react-native/icons/maximize-2';
import MessageSquarePlus from 'lucide-react-native/icons/message-square-plus';
import Minimize2 from 'lucide-react-native/icons/minimize-2';
import X from 'lucide-react-native/icons/x';
import { type Ref, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
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
import { TagPicker } from '@/components/tag-picker';
import { SharedUndoBar } from '@/components/undo-bar';
import { useOutbox } from '@/lib/outbox';
import { offerUndo } from '@/lib/undo';

type Mode = 'excerpt' | 'comment';

/** An Excerpt saved on this screen, which a Comment can join. */
type SavedExcerpt = { id: string; locator: string | null; excerpt: string };

/** What the Source page asks of the box. */
export type NoteComposerHandle = {
  /** "Yorum ekle": the Comment written next joins the Excerpt saved last. */
  commentOnLastExcerpt: () => void;
};

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
 * accident. The box stays on Alıntı after an Excerpt is saved; a Comment joins
 * that Excerpt's Note only through the "Yorum ekle" under it, which lasts until
 * the Locator changes (#123). Yorum in the segment is always a Note of its own.
 */
export function NoteComposer({
  ref,
  sourceId,
  sourceType,
  carriedLocator,
  carriedSince,
  expanded,
  onExpandedChange,
  autoFocus,
  onFocusChange,
  onSaved,
  onCommentableChange,
}: {
  ref?: Ref<NoteComposerHandle>;
  sourceId: string;
  sourceType: SourceType;
  carriedLocator: string;
  /** When the carried Locator was first noted at, in ms; its age starts there. */
  carriedSince: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  /** Opens the box ready to write, as Genel Bakış's Kaldığın yer does. */
  autoFocus?: boolean;
  /** The box is open while its text has the focus. */
  onFocusChange: (focused: boolean) => void;
  /** The Note just saved, so the list can show it. */
  onSaved: (id: string) => void;
  /** The Note whose row offers "Yorum ekle", or null while none does. */
  onCommentableChange: (id: string | null) => void;
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
  // The Excerpt saved last on this screen, while the Locator in the box is still its own.
  const [lastExcerpt, setLastExcerpt] = useState<SavedExcerpt | null>(null);
  // Set by "Yorum ekle": the Comment being written joins this Excerpt's Note.
  const [replyTo, setReplyTo] = useState<SavedExcerpt | null>(null);
  const inputRef = useRef<TextInputInstance>(null);
  // The id a failed save used, kept while nothing changes, so sending the
  // same Note again cannot make a second one.
  const attempt = useRef<{ id: string; key: string } | null>(null);

  // The keyboard, while up, covers the phone's navigation bar: the box sits
  // right on it then, with no room kept for the bar.
  const [keyboardUp, setKeyboardUp] = useState(false);
  // Android keeps the focus when its keyboard is put away: let the box close
  // with it, so the next tap opens it again (and brings the list back).
  useEffect(() => {
    const shown = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setKeyboardUp(true),
    );
    const hidden = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardUp(false);
      inputRef.current?.blur();
    });
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  // A Locator gets old while the screen stays open.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);
  const stale = locator.trim() !== '' && now - locatorSince > locatorCheckAfter;

  // While its Comment is being written, the Excerpt's row no longer offers "Yorum ekle".
  const commentable = replyTo ? null : (lastExcerpt?.id ?? null);
  useEffect(() => onCommentableChange(commentable), [commentable, onCommentableChange]);

  useImperativeHandle(ref, () => ({
    commentOnLastExcerpt: () => {
      if (!lastExcerpt) return;
      setReplyTo(lastExcerpt);
      setFailure(null);
      inputRef.current?.focus();
    },
  }));

  // × on the strip: back to Alıntı, and the Excerpt still offers "Yorum ekle".
  const closeReply = () => {
    setReplyTo(null);
    setMode('excerpt');
    inputRef.current?.focus();
  };

  // Writing to an Excerpt is writing a Comment, whatever the segment says.
  const writing: Mode = replyTo ? 'comment' : mode;

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

  const canSave = text.trim() !== '' && !busy;
  // Through the outbox, which sends now or once the connection returns; the
  // box does not know which. A failure comes back only where there is no
  // outbox (the web).
  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setFailure(null);
    try {
      if (replyTo) {
        const { id } = replyTo;
        // Made now, so the Comment's own Note would sort where it was written.
        // Geri al splits it off with this id; so does the outbox, should the
        // Excerpt's Note no longer take the Comment once it is sent (#58).
        const commentNoteId = uuidv7();
        const ownNote = { id: commentNoteId, sourceId, locator: replyTo.locator };
        await apply({ type: 'attachComment', id, comment: text, tags, ownNote });
        saved(id);
        // The Note has its Comment: the box goes back to Alıntı.
        setReplyTo(null);
        setLastExcerpt(null);
        setMode('excerpt');
        offerUndo({
          message: t('capture.commentAttached'),
          undo: () => {
            void detach(id, commentNoteId);
            inputRef.current?.focus();
          },
        });
        return;
      }
      const note = { sourceId, locator, tags, ...(writing === 'excerpt' ? { excerpt: text } : { comment: text }) };
      const key = JSON.stringify(note);
      if (attempt.current?.key !== key) attempt.current = { id: uuidv7(), key };
      const { id } = attempt.current;
      await apply({ type: 'createNote', note: { id, ...note } });
      attempt.current = null;
      saved(id);
      if (writing === 'excerpt') setLastExcerpt({ id, locator: storedLocator(locator), excerpt: text });
    } catch (error) {
      // The Note took another Comment or went away elsewhere: the text stays
      // in the box as a Yorum, to be saved as a Note of its own.
      const refused = replyTo && error instanceof OperationRefused;
      if (refused) {
        setReplyTo(null);
        setLastExcerpt(null);
        setMode('comment');
      }
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
    // "Yorum ekle" stays on the Excerpt only while its Locator does.
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
  }, [text, writing, expanded]);

  const shownLocator = locator.trim() || t('capture.noLocator');

  return (
    <View
      style={[
        styles.composer,
        { paddingBottom: (keyboardUp ? 0 : insets.bottom) + space.md },
        expanded && styles.composerExpanded,
      ]}
    >
      <SharedUndoBar />
      {replyTo ? (
        // "s. 52 alıntısına yorum": the Comment's Excerpt, in place of the controls.
        <View style={styles.reply}>
          <CornerDownRight color={colors.accent} size={18} strokeWidth={1.6} style={styles.replyIcon} />
          <View style={styles.replyText}>
            <Text style={styles.replyLabel} numberOfLines={1}>
              {replyTo.locator ? t('capture.commentOn', { locator: replyTo.locator }) : t('capture.commentOnNoLocator')}
            </Text>
            <Text style={styles.replyExcerpt} numberOfLines={1}>
              {replyTo.excerpt.trim().split('\n')[0]}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('capture.commentOnClose')}
            onPress={closeReply}
            style={({ pressed }) => [styles.iconAction, styles.replyClose, pressed && styles.pressed]}
          >
            <X color={colors.ink2} size={18} strokeWidth={1.6} />
          </Pressable>
        </View>
      ) : (
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
                setMode(next);
                inputRef.current?.focus();
              }}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(expanded ? 'capture.collapse' : 'capture.expand')}
            onPress={() => {
              // Full screen covers where the bar would sit.
              if (!expanded) offerUndo(null);
              onExpandedChange(!expanded);
            }}
            style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
          >
            {expanded ? (
              <Minimize2 color={colors.ink2} size={18} strokeWidth={1.6} />
            ) : (
              <Maximize2 color={colors.ink2} size={18} strokeWidth={1.6} />
            )}
          </Pressable>
        </View>
      )}

      <View style={[styles.inputRow, expanded && styles.inputRowExpanded]}>
        <TextInput
          ref={inputRef}
          accessibilityLabel={t(`capture.${writing}`)}
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
          placeholder={t(writing === 'excerpt' ? 'capture.excerptPlaceholder' : 'capture.commentPlaceholder')}
          placeholderTextColor={colors.muted2}
          style={[
            styles.input,
            writing === 'excerpt' ? styles.excerpt : styles.comment,
            expanded ? styles.inputExpanded : styles.inputGrowing,
            focused && styles.focused,
          ]}
        />
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

/** "Yorum ekle" under the Excerpt saved last: the Comment written next joins its Note. */
export function AddCommentButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.addComment, pressed && styles.pressed]}
    >
      <MessageSquarePlus color={colors.accent} size={16} strokeWidth={1.6} />
      <Text style={styles.addCommentText}>{t('capture.addComment')}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // Design system Capture (#68): the box sits on card ground under a rule.
    composer: {
      gap: 9,
      paddingHorizontal: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.surface,
    },
    composerExpanded: { flex: 1, borderTopWidth: 0 },
    // The Excerpt a Comment is being written to, over the box.
    reply: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    replyIcon: { marginTop: 1 },
    replyText: { flex: 1, minWidth: 0, gap: 2, borderLeftWidth: 2, borderLeftColor: c.accent, paddingLeft: 10 },
    replyLabel: { ...typeScale.label, color: c.accent },
    replyExcerpt: { ...typeScale.excerptSm, color: c.quoteInk },
    replyClose: { marginTop: -6 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    locator: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
    locatorChip: {
      flexShrink: 1,
      paddingVertical: 4,
      paddingHorizontal: 11,
      borderRadius: radius.chip,
      backgroundColor: c.accentSoft,
    },
    locatorText: { ...typeScale.locatorSm, color: c.accent },
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
    tagsText: { ...typeScale.labelSm, color: c.accent },
    tagsChosenText: { ...typeScale.labelSm, color: c.chipInk },
    mode: { marginLeft: 'auto' },
    // Genişlet / Küçült at the end of the controls, and × on the strip: an icon, no frame.
    iconAction: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.control,
    },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
    inputRowExpanded: { flex: 1, alignItems: 'stretch' },
    input: {
      flex: 1,
      color: c.fg,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.control,
      paddingHorizontal: 13,
      paddingTop: 10,
      paddingBottom: 10,
      textAlignVertical: 'top',
      // No browser focus ring on web. Set from the start, not on focus: adding an outline to an
      // Android input redraws its background and drops its padding, the text then touching the border.
      outlineWidth: 0,
    },
    // Only the accent border, as in the design.
    focused: { borderColor: c.accent },
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
    send: {
      width: 46,
      height: 46,
      alignSelf: 'flex-end',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.control,
      backgroundColor: c.accent,
    },
    inactive: { opacity: 0.35 },
    pressed: { opacity: 0.7 },
    error: { ...typeScale.caption, color: c.danger },
    addComment: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
    addCommentText: { ...typeScale.link, color: c.accent },
  });
