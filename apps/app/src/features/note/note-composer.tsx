import type { SourceType } from '@homelibra/core/source';
import { Button } from '@homelibra/ui/button';
import { Dialog } from '@homelibra/ui/dialog';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { cx, space, type as typeScale, useTheme } from '@homelibra/ui/theme';
import PenLine from 'lucide-react-native/icons/pen-line';
import Plus from 'lucide-react-native/icons/plus';
import { type RefObject, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  type TextInputInstance,
  type TextInputKeyPressEvent,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocatorSheet } from '@/features/note/locator-sheet';
import { useNoteCapture } from '@/features/note/note-capture';
import { TagPicker } from '@/features/tag/tag-picker';
import { SharedUndoBar } from '@/components/undo-bar';

// The fields are a few lines tall before anything is written in them.
// The gaps and padding below are the classes `gap-1.75` (labelGap), `gap-4.5` (fieldsGap) and `pt-1`
// (fieldsPaddingTop) on the fields; change both together.
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const capture = useNoteCapture({ sourceId, carriedLocator, onSaved });
  const { excerpt, setExcerpt, comment, setComment, tags, setTags, hasText, busy, failed } = capture;
  const [open, setOpen] = useState(openAtStart);
  const [discarding, setDiscarding] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [editingLocator, setEditingLocator] = useState(false);
  const [pickingTags, setPickingTags] = useState(false);
  const excerptRef = useRef<TextInputInstance>(null);
  const commentRef = useRef<TextInputInstance>(null);
  // The height the fields have over the keyboard; 0 until it has been measured.
  const [fieldsRoom, setFieldsRoom] = useState(0);

  const backToExcerpt = () => excerptRef.current?.focus();

  const close = () => {
    setDiscarding(false);
    setOpen(false);
    capture.discard();
    setCommenting(false);
  };
  // Every way out comes here: a draft is never lost without asking.
  const requestClose = () => (hasText ? setDiscarding(true) : close());

  // Through the outbox, which sends now or once the connection returns; the
  // sheet does not know which. Saved, the sheet stays open for the next Note.
  const save = async () => {
    if (!(await capture.save())) return;
    setCommenting(false);
    backToExcerpt();
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
    capture.setLocator(next);
    backToExcerpt();
  };

  useGrowOnWeb(excerptRef, excerpt, open);
  useGrowOnWeb(commentRef, comment, open && commenting);

  const { trimmedLocator, carriedOn } = capture;
  const shownLocator = trimmedLocator || t('capture.noLocator');

  return (
    <>
      {/* One line under a rule at the page's foot: "Not al", and where writing would go on from. */}
      <View className={cx('border-t border-line bg-page', hidden && 'hidden')} style={{ paddingBottom: insets.bottom }}>
        <SharedUndoBar />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={carriedOn ? `${t('capture.open')}, ${carriedOn}` : t('capture.open')}
          onPress={() => setOpen(true)}
          className="min-h-13.5 flex-row items-center justify-between gap-md px-4.5 active:opacity-70"
        >
          <View className="flex-row items-center gap-2.25">
            <PenLine color={colors.accent} size={18} strokeWidth={1.8} />
            <Text variant="action">{t('capture.open')}</Text>
          </View>
          {carriedOn && (
            <Text variant="locator" color="ink2" numberOfLines={1} className="shrink">
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
          // Vazgeç · Yeni Not · Kaydet, the title in the middle whatever the sides' widths.
          <View className="flex-row items-center gap-sm">
            <View className="flex-1 flex-row">
              <Pressable
                accessibilityRole="button"
                onPress={requestClose}
                hitSlop={8}
                className="min-h-11 justify-center active:opacity-70"
              >
                <Text variant="label" color="ink2">
                  {t('capture.cancel')}
                </Text>
              </Pressable>
            </View>
            <Text variant="sourceTitleSm" role="heading" numberOfLines={1}>
              {t('capture.title')}
            </Text>
            <View className="flex-1 flex-row justify-end">
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
        {/* On one baseline: the label, the value and the link are three sizes of type. */}
        <View className="flex-row items-baseline gap-x-2.5">
          <Text variant="fieldLabel">{t('capture.locator')}</Text>
          <Text
            variant={trimmedLocator ? 'sourceTitle' : 'body'}
            // A value, not a heading, though it is set in a title's face.
            role={undefined}
            color={trimmedLocator ? 'fg' : 'muted'}
            numberOfLines={1}
            className="shrink"
          >
            {shownLocator}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('capture.changeLocatorLabel', { locator: shownLocator })}
            onPress={() => setEditingLocator(true)}
            hitSlop={8}
            className="ml-auto min-h-9 justify-center active:opacity-70"
          >
            <Text variant="link">{t('capture.changeLocator')}</Text>
          </Pressable>
        </View>

        {/* Held to the height there is: long text scrolls inside its own field, and Alıntı and Yorum stay in sight together. */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4.5 pt-1 pb-lg"
          contentContainerStyle={fieldsRoom > 0 ? { height: Math.max(fieldsRoom, fieldsMinHeight) } : undefined}
          keyboardShouldPersistTaps="handled"
          onLayout={(event) => setFieldsRoom(event.nativeEvent.layout.height)}
        >
          <View className="shrink gap-1.75" style={{ minHeight: excerptFieldMinHeight }}>
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
              className={excerptInput}
              style={{ minHeight: excerptMinHeight }}
            />
          </View>
          {commenting ? (
            <View className="shrink gap-1.75" style={{ minHeight: commentFieldMinHeight }}>
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
                className={commentInput}
                style={{ minHeight: commentMinHeight }}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setCommenting(true)}
              hitSlop={6}
              className="min-h-8 flex-row items-center gap-1.5 self-start active:opacity-70"
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
        <View className="flex-row items-center border-t border-line pt-sm">
          <SharedUndoBar />
          {/* "+ etiket"; once Tags are chosen, their names. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={tags.length > 0 ? `${t('tags.field')}: ${tags.join(', ')}` : t('tags.add')}
            onPress={() => setPickingTags(true)}
            hitSlop={6}
            className={cx(
              'shrink rounded-chip border px-2.25 py-0.75 active:opacity-70',
              tags.length > 0 ? 'border-solid border-chip-bg bg-chip-bg' : 'border-dashed border-line',
            )}
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

// No box: the words on the sheet itself. No browser focus ring on web (`outline-0`, which native
// ignores): set from the start, not on focus, as adding an outline to an Android input redraws its
// background and drops its padding.
const input = 'shrink p-0 align-top outline-0';
// The author's words: the quote face and the quote rule.
const excerptInput = `${input} type-excerpt text-quote-ink border-l-2 border-quote-bar pl-3`;
const commentInput = `${input} type-comment text-ink3`;
