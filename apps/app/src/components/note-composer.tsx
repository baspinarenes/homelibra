import { ablativeTr } from '@homelibra/core';
import type { SourceType } from '@homelibra/core/source';
import { Button } from '@homelibra/ui/button';
import { Dialog } from '@homelibra/ui/dialog';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import PenLine from 'lucide-react-native/icons/pen-line';
import Plus from 'lucide-react-native/icons/plus';
import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  type TextInputKeyPressEvent,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uuidv7 } from 'uuidv7';

import { LocatorSheet } from '@/components/locator-sheet';
import { TagPicker } from '@/components/tag-picker';
import { SharedUndoBar } from '@/components/undo-bar';
import { useOutbox } from '@/lib/outbox';
import { offerReceiptUndo } from '@/lib/undo';

// The fields are a few lines tall before anything is written in them.
const excerptMinHeight = typeScale.excerpt.lineHeight * 3;
const commentMinHeight = typeScale.comment.lineHeight * 2;

const labelGap = 7;
const fieldsGap = 18;
const fieldsPaddingTop = 4;
const fieldHeadHeight = typeScale.fieldLabel.lineHeight + labelGap;
const excerptFieldMinHeight = fieldHeadHeight + excerptMinHeight;
const commentFieldMinHeight = fieldHeadHeight + commentMinHeight;
// Below this the two fields no longer fit, and the sheet's body scrolls after all.
const fieldsMinHeight = fieldsPaddingTop + excerptFieldMinHeight + fieldsGap + commentFieldMinHeight + space.lg;

/**
 * Capture at the foot of the Source page (#87, #157): one line, "Not al" and
 * the Locator carried over from the Note captured last, that opens the
 * writing sheet. The sheet holds one Note: its Konum, its Alıntı, a Yorum
 * once "Yorum ekle" asks for one, and its Tags. Kaydet saves it and the
 * sheet stays open for the next, the Locator kept and the rest emptied, with
 * "Not kaydedildi · Geri al" in it. Every way out of a sheet with text in it
 * (Vazgeç, a drag down, the dimmed screen, Android's back, Esc on the web)
 * asks "Taslağı at?" first. On the web Ctrl/Cmd+Enter saves; Enter is a new
 * line, so a long Excerpt is never cut in two by accident.
 */
export function NoteComposer({
  sourceId,
  sourceType,
  carriedLocator,
  openAtStart,
  hidden,
  onSaved,
}: {
  sourceId: string;
  sourceType: SourceType;
  carriedLocator: string;
  /** Opens the sheet ready to write, as Genel Bakış's Kaldığın yer does. */
  openAtStart: boolean;
  /** The bar is gone while "Bu kaynakta ara" is open. */
  hidden: boolean;
  /** The Note just saved, so the list behind can show it. */
  onSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { apply } = useOutbox();
  const [open, setOpen] = useState(openAtStart);
  const [discarding, setDiscarding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [locator, setLocator] = useState(carriedLocator);
  const [editingLocator, setEditingLocator] = useState(false);
  // The Tags for the Note being written; untagged is the default, and each save starts untagged again.
  const [tags, setTags] = useState<string[]>([]);
  const [pickingTags, setPickingTags] = useState(false);
  const excerptRef = useRef<TextInputInstance>(null);
  const commentRef = useRef<TextInputInstance>(null);
  // The id a failed save used, kept while nothing changes, so sending the
  // same Note again cannot make a second one.
  const attempt = useRef<{ id: string; key: string } | null>(null);
  // The height the fields have over the keyboard; 0 until it has been measured.
  const [fieldsRoom, setFieldsRoom] = useState(0);

  const backToExcerpt = () => excerptRef.current?.focus();

  const hasText = excerpt.trim() !== '' || comment.trim() !== '';

  // What a Note's save or a discarded draft empties; the Locator stays.
  const clearDraft = () => {
    setExcerpt('');
    setComment('');
    setCommenting(false);
    setTags([]);
  };

  const close = () => {
    setDiscarding(false);
    setOpen(false);
    clearDraft();
    setFailed(false);
    attempt.current = null;
  };
  // Every way out comes here: a draft is never lost without asking.
  const requestClose = () => (hasText ? setDiscarding(true) : close());

  // Through the outbox, which sends now or once the connection returns; the
  // sheet does not know which. A failure comes back only where there is no
  // outbox (the web).
  const save = async () => {
    if (!hasText || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const note = { sourceId, locator, tags, excerpt, comment };
      const key = JSON.stringify(note);
      if (attempt.current?.key !== key) attempt.current = { id: uuidv7(), key };
      const { id } = attempt.current;
      await apply({ type: 'createNote', note: { id, ...note } });
      attempt.current = null;
      onSaved(id);
      clearDraft();
      backToExcerpt();
      // Geri al takes the Note away as Notu sil does, offline too.
      offerReceiptUndo(t('capture.saved'), async () => {
        await apply({ type: 'deleteNote', id });
      });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  // The web's keyboard event; a phone has no Ctrl or Cmd to hold.
  const saveOnCtrlEnter = (event: TextInputKeyPressEvent) => {
    const key = event as unknown as { key: string; ctrlKey?: boolean; metaKey?: boolean; preventDefault: () => void };
    if (Platform.OS !== 'web' || key.key !== 'Enter' || !(key.ctrlKey || key.metaKey)) return;
    key.preventDefault();
    void save();
  };

  const setLocatorFromSheet = (next: string) => {
    setEditingLocator(false);
    setLocator(next);
    backToExcerpt();
  };

  useGrowOnWeb(excerptRef, excerpt, open);
  useGrowOnWeb(commentRef, comment, open && commenting);

  const trimmedLocator = locator.trim();
  const shownLocator = trimmedLocator || t('capture.noLocator');
  const carriedOn = trimmedLocator ? t('capture.carriedOn', { from: ablativeTr(trimmedLocator) }) : null;

  return (
    <>
      <View style={[styles.bar, { paddingBottom: insets.bottom }, hidden && styles.hidden]}>
        <SharedUndoBar />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={carriedOn ? `${t('capture.open')}, ${carriedOn}` : t('capture.open')}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.barButton, pressed && styles.pressed]}
        >
          <View style={styles.barStart}>
            <PenLine color={colors.accent} size={18} strokeWidth={1.8} />
            <Text variant="action">{t('capture.open')}</Text>
          </View>
          {carriedOn && (
            <Text variant="locator" color="ink2" numberOfLines={1} style={styles.barLocator}>
              {carriedOn}
            </Text>
          )}
        </Pressable>
      </View>

      <Sheet
        visible={open}
        fill
        title={t('capture.title')}
        onClose={requestClose}
        onShown={backToExcerpt}
        header={
          <View style={styles.head}>
            <View style={styles.headSide}>
              <Pressable
                accessibilityRole="button"
                onPress={requestClose}
                hitSlop={8}
                style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
              >
                <Text variant="label" color="ink2">
                  {t('capture.cancel')}
                </Text>
              </Pressable>
            </View>
            <Text variant="sourceTitleSm" role="heading" numberOfLines={1}>
              {t('capture.title')}
            </Text>
            <View style={[styles.headSide, styles.headEnd]}>
              <Button
                label={t('capture.save')}
                variant="small"
                onPress={() => void save()}
                disabled={!hasText}
                busy={busy}
              />
            </View>
          </View>
        }
      >
        <View style={styles.locatorRow}>
          <Text variant="fieldLabel">{t('capture.locator')}</Text>
          <Text
            variant={trimmedLocator ? 'sourceTitle' : 'body'}
            // A value, not a heading, though it is set in a title's face.
            role={undefined}
            color={trimmedLocator ? 'fg' : 'muted'}
            numberOfLines={1}
            style={styles.locatorValue}
          >
            {shownLocator}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('capture.changeLocatorLabel', { locator: shownLocator })}
            onPress={() => setEditingLocator(true)}
            hitSlop={8}
            style={({ pressed }) => [styles.change, pressed && styles.pressed]}
          >
            <Text variant="link">{t('capture.changeLocator')}</Text>
          </Pressable>
        </View>

        {/* Held to the height there is: long text scrolls inside its own field, and Alıntı and Yorum stay in sight together. */}
        <ScrollView
          style={styles.fields}
          contentContainerStyle={[
            styles.fieldsContent,
            fieldsRoom > 0 && { height: Math.max(fieldsRoom, fieldsMinHeight) },
          ]}
          keyboardShouldPersistTaps="handled"
          onLayout={(event) => setFieldsRoom(event.nativeEvent.layout.height)}
        >
          <View style={[styles.field, styles.excerptField]}>
            <Text variant="fieldLabel">{t('capture.excerpt')}</Text>
            <TextInput
              ref={excerptRef}
              accessibilityLabel={t('capture.excerpt')}
              multiline
              value={excerpt}
              onChangeText={setExcerpt}
              onKeyPress={saveOnCtrlEnter}
              placeholder={t('capture.excerptPlaceholder')}
              placeholderTextColor={colors.muted2}
              style={[styles.input, styles.excerpt]}
            />
          </View>
          {commenting ? (
            <View style={[styles.field, styles.commentField]}>
              <Text variant="fieldLabel">{t('capture.comment')}</Text>
              <TextInput
                ref={commentRef}
                accessibilityLabel={t('capture.comment')}
                multiline
                autoFocus
                value={comment}
                onChangeText={setComment}
                onKeyPress={saveOnCtrlEnter}
                placeholder={t('capture.commentPlaceholder')}
                placeholderTextColor={colors.muted2}
                style={[styles.input, styles.comment]}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setCommenting(true)}
              hitSlop={6}
              style={({ pressed }) => [styles.addComment, pressed && styles.pressed]}
            >
              <Plus color={colors.accent} size={16} strokeWidth={1.8} />
              <Text variant="link">{t('capture.addComment')}</Text>
            </Pressable>
          )}
          {failed && (
            <Text variant="caption" color="danger">
              {t('capture.saveFailed')}
            </Text>
          )}
        </ScrollView>

        {/* Just over the keyboard; the Geri al of the Note saved last floats above it. */}
        <View style={styles.toolbar}>
          <SharedUndoBar />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tags.length > 0 ? `${t('tags.field')}: ${tags.join(', ')}` : t('tags.add')}
            onPress={() => setPickingTags(true)}
            hitSlop={6}
            style={({ pressed }) => [styles.tags, tags.length > 0 && styles.tagsChosen, pressed && styles.pressed]}
          >
            <Text variant="labelSm" color={tags.length > 0 ? 'chipInk' : 'accent'} numberOfLines={1}>
              {tags.length > 0 ? tags.join(', ') : t('tags.add')}
            </Text>
          </Pressable>
        </View>

        <LocatorSheet
          visible={editingLocator}
          sourceType={sourceType}
          locator={trimmedLocator}
          onDone={setLocatorFromSheet}
          onClose={() => {
            setEditingLocator(false);
            backToExcerpt();
          }}
          // On the web the closing sheet would take the focus with it.
          onHidden={backToExcerpt}
        />
        <TagPicker
          visible={pickingTags}
          title={t('tags.noteTitle')}
          value={tags}
          onChange={setTags}
          onClose={() => {
            setPickingTags(false);
            backToExcerpt();
          }}
        />
        <Dialog
          visible={discarding}
          message={t('capture.discard')}
          cancelLabel={t('capture.discardCancel')}
          confirmLabel={t('capture.discardConfirm')}
          destructive
          onConfirm={close}
          onCancel={() => {
            setDiscarding(false);
            backToExcerpt();
          }}
        />
      </Sheet>
    </>
  );
}

/** Native multiline inputs grow with their text; a web textarea needs telling. */
function useGrowOnWeb(ref: RefObject<TextInputInstance | null>, text: string, shown: boolean) {
  useLayoutEffect(() => {
    const node = ref.current as unknown as { style: { height: string }; scrollHeight: number } | null;
    if (Platform.OS !== 'web' || !shown || !node) return;
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  }, [ref, text, shown]);
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // One line under a rule at the page's foot: "Not al", and where writing would go on from.
    bar: { borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.page },
    barButton: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.md,
      paddingHorizontal: space.gutter - 4,
    },
    barStart: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    barLocator: { flexShrink: 1 },
    hidden: { display: 'none' },
    pressed: { opacity: 0.7 },
    // Vazgeç · Yeni Not · Kaydet, the title in the middle whatever the sides' widths.
    head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    headSide: { flex: 1, flexDirection: 'row' },
    headEnd: { justifyContent: 'flex-end' },
    cancel: { minHeight: 44, justifyContent: 'center' },
    // On one baseline: the label, the value and the link are three sizes of type.
    locatorRow: { flexDirection: 'row', alignItems: 'baseline', columnGap: 10 },
    locatorValue: { flexShrink: 1 },
    change: { marginLeft: 'auto', minHeight: 36, justifyContent: 'center' },
    fields: { flex: 1 },
    fieldsContent: { gap: fieldsGap, paddingTop: fieldsPaddingTop, paddingBottom: space.lg },
    field: { gap: labelGap, flexShrink: 1 },
    excerptField: { minHeight: excerptFieldMinHeight },
    commentField: { minHeight: commentFieldMinHeight },
    // No box: the words on the sheet itself.
    input: {
      flexShrink: 1,
      padding: 0,
      color: c.fg,
      textAlignVertical: 'top',
      // No browser focus ring on web. Set from the start, not on focus: adding an outline to an
      // Android input redraws its background and drops its padding.
      outlineWidth: 0,
    },
    // The author's words: the quote face and the quote rule.
    excerpt: {
      ...typeScale.excerpt,
      color: c.quoteInk,
      minHeight: excerptMinHeight,
      borderLeftWidth: 2,
      borderLeftColor: c.quoteBar,
      paddingLeft: 12,
    },
    comment: { ...typeScale.comment, color: c.ink3, minHeight: commentMinHeight },
    addComment: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32 },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: space.sm,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
    // "+ etiket"; once Tags are chosen, their names.
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
  });
