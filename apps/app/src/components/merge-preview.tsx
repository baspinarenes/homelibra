import { mergeNotes } from '@homelibra/core/note';
import type { ListedNote } from '@homelibra/outbox';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/field';
import { PrimaryButton } from '@/components/primary-button';
import { NoteTagsLine } from '@/components/tag-chips';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Birleştirme önizlemesi (#13): the selected Notes as one, the way the
 * server will make it (core's mergeNotes): Excerpts and Comments in Locator
 * order a paragraph apart, every Tag, the first Note's Locator. The Locator
 * and the texts can be corrected before Birleştir. Open while `notes` is set.
 */
export function MergePreview({
  notes,
  onMerged,
  onClose,
}: {
  notes: ListedNote[] | null;
  onMerged: (undoToken: string, count: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={notes !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('selection.close')}
          style={styles.dismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.header}>
            <Text style={styles.heading}>{t('selection.previewTitle')}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{t('selection.close')}</Text>
            </Pressable>
          </View>
          {/* Mounted afresh each time, so the fields start from the merge. */}
          {notes && <MergeForm notes={notes} onMerged={onMerged} />}
        </View>
      </View>
    </Modal>
  );
}

function MergeForm({ notes, onMerged }: { notes: ListedNote[]; onMerged: (undoToken: string, count: number) => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const [merged] = useState(() => mergeNotes(notes.map((n) => ({ ...n, tags: n.tags.map((tag) => tag.name) }))));
  const [locator, setLocator] = useState(merged.locator ?? '');
  const [excerpt, setExcerpt] = useState(merged.excerpt ?? '');
  const [comment, setComment] = useState(merged.comment ?? '');
  const hasText = excerpt.trim() !== '' || comment.trim() !== '';
  const merge = useMutation(
    trpc.notes.merge.mutationOptions({ onSuccess: ({ undoToken }) => onMerged(undoToken, notes.length) }),
  );

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>{t('selection.previewLead', { count: notes.length })}</Text>
      <Field
        label={t('noteEdit.locator')}
        value={locator}
        onChangeText={setLocator}
        placeholder={t('capture.locatorPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Field label={t('noteEdit.excerpt')} value={excerpt} onChangeText={setExcerpt} multiline quote />
      <Field label={t('noteEdit.comment')} value={comment} onChangeText={setComment} multiline />
      {merged.tags.length > 0 && (
        <View style={styles.tags}>
          <Text style={styles.label}>{t('tags.field').toLocaleUpperCase('tr')}</Text>
          <NoteTagsLine names={merged.tags} />
        </View>
      )}
      {!hasText && <Text style={styles.error}>{t('noteEdit.needsText')}</Text>}
      {merge.isError && <Text style={styles.error}>{t('selection.mergeFailed')}</Text>}
      <PrimaryButton
        label={t('selection.merge')}
        onPress={() => merge.mutate({ ids: notes.map((n) => n.id), locator, excerpt, comment })}
        busy={merge.isPending}
        disabled={!hasText}
      />
    </ScrollView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    sheet: {
      width: '100%',
      maxWidth: 640,
      maxHeight: '92%',
      alignSelf: 'center',
      backgroundColor: c.page,
      borderTopLeftRadius: radius.hero,
      borderTopRightRadius: radius.hero,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: space.lg,
      paddingTop: space.lg,
      paddingBottom: space.sm,
    },
    heading: { ...typeScale.sourceTitle, color: c.fg },
    close: { ...typeScale.button, color: c.accent },
    body: { gap: space.lg, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md },
    lead: { ...typeScale.body, color: c.ink2 },
    tags: { gap: 8 },
    label: { ...typeScale.micro, color: c.muted },
    error: { ...typeScale.body, color: c.danger },
  });
