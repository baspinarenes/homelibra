import { mergeNotes } from '@homelibra/core/note';
import type { ListedNote } from '@homelibra/outbox';
import { Sheet } from '@homelibra/ui/sheet';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { NoteTagsLine } from '@/components/tag-chips';
import { useTRPC } from '@/lib/trpc';

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
  // Each opening starts afresh from the merge; the last one's Notes stay on
  // the sheet while it slides away.
  const open = notes !== null;
  const [opening, setOpening] = useState(() => (notes ? { notes, n: 1, open } : null));
  if (notes && (!opening?.open || opening.notes !== notes)) setOpening({ notes, n: (opening?.n ?? 0) + 1, open });
  else if (!notes && opening?.open) setOpening({ ...opening, open });
  if (!opening) return null;
  return <MergeSheet key={opening.n} notes={opening.notes} visible={open} onMerged={onMerged} onClose={onClose} />;
}

function MergeSheet({
  notes,
  visible,
  onMerged,
  onClose,
}: {
  notes: ListedNote[];
  visible: boolean;
  onMerged: (undoToken: string, count: number) => void;
  onClose: () => void;
}) {
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
    <Sheet
      visible={visible}
      title={t('selection.previewTitle')}
      closeLabel={t('selection.close')}
      onClose={onClose}
      primary={{
        label: t('selection.merge'),
        onPress: () => merge.mutate({ ids: notes.map((n) => n.id), locator, excerpt, comment }),
        busy: merge.isPending,
        disabled: !hasText,
      }}
    >
      <Text style={styles.lead}>{t('selection.previewLead', { count: notes.length })}</Text>
      <TextField
        label={t('noteEdit.locator')}
        value={locator}
        onChangeText={setLocator}
        placeholder={t('capture.locatorPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField label={t('noteEdit.excerpt')} value={excerpt} onChangeText={setExcerpt} multiline quote />
      <TextField label={t('noteEdit.comment')} value={comment} onChangeText={setComment} multiline />
      {merged.tags.length > 0 && (
        <View style={styles.tags}>
          <Text style={styles.label}>{t('tags.field').toLocaleUpperCase('tr')}</Text>
          <NoteTagsLine names={merged.tags} />
        </View>
      )}
      {!hasText && <Text style={styles.error}>{t('noteEdit.needsText')}</Text>}
      {merge.isError && <Text style={styles.error}>{t('selection.mergeFailed')}</Text>}
    </Sheet>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    lead: { ...typeScale.caption, color: c.muted },
    tags: { gap: 6 },
    label: { ...typeScale.micro, color: c.muted },
    error: { ...typeScale.caption, color: c.danger },
  });
