import { tagName, tagSuggestKey } from '@homelibra/core/tag';
import { Dialog, DialogMessage } from '@homelibra/ui/dialog';
import { Sheet, SheetAction } from '@homelibra/ui/sheet';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Merge from 'lucide-react-native/icons/merge';
import PenLine from 'lucide-react-native/icons/pen-line';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';

export type TagRef = { id: string; name: string };

/** The ⋯ at the end of an Etiketler row: opens {@link TagActions} for that Tag. */
export function TagMenuButton({ name, onPress }: { name: string; onPress: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('tagActions.menuFor', { name })}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.more, pressed && styles.pressed]}
    >
      <Text style={styles.moreText}>⋯</Text>
    </Pressable>
  );
}

type Step =
  { kind: 'menu' } | { kind: 'rename' } | { kind: 'pick' } | { kind: 'merge'; into: TagRef } | { kind: 'delete' };

/**
 * The ⋯ menu of a Tag in Etiketler (#3, #36): Yeniden adlandır, Birleştir
 * and Sil. A rename that only changes the spelling just happens; one onto
 * another Tag's name asks, then merges. A merge cannot be taken back; a
 * delete asks with its counts and offers Geri al. Mount it with the Tag's
 * id as key, so each Tag starts at the menu.
 */
export function TagActions({ tag, onClose }: { tag: TagRef | null; onClose: () => void }) {
  const [step, setStep] = useState<Step>({ kind: 'menu' });
  if (!tag) return null;
  switch (step.kind) {
    case 'menu':
      return <Menu tag={tag} onChoose={setStep} onClose={onClose} />;
    case 'rename':
      return <Rename tag={tag} onMerge={(into) => setStep({ kind: 'merge', into })} onClose={onClose} />;
    case 'pick':
      return <PickTarget tag={tag} onPick={(into) => setStep({ kind: 'merge', into })} onClose={onClose} />;
    case 'merge':
      return <ConfirmMerge tag={tag} into={step.into} onClose={onClose} />;
    case 'delete':
      return <ConfirmDelete tag={tag} onClose={onClose} />;
  }
}

/** A Tag's name shows everywhere a Note or Source shows: everything refreshes. */
function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

function Menu({ tag, onChoose, onClose }: { tag: TagRef; onChoose: (step: Step) => void; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Sheet visible title={tag.name} closeLabel={t('tagActions.close')} onClose={onClose}>
      <View>
        <SheetAction icon={PenLine} label={t('tagActions.rename')} onPress={() => onChoose({ kind: 'rename' })} />
        <SheetAction icon={Merge} label={t('tagActions.merge')} onPress={() => onChoose({ kind: 'pick' })} />
        <SheetAction
          icon={Trash}
          label={t('tagActions.delete')}
          destructive
          onPress={() => onChoose({ kind: 'delete' })}
        />
      </View>
    </Sheet>
  );
}

function Rename({ tag, onMerge, onClose }: { tag: TagRef; onMerge: (into: TagRef) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const refreshAll = useRefreshAll();
  const [value, setValue] = useState(tag.name);
  const rename = useMutation(
    trpc.tags.rename.mutationOptions({
      onSuccess: async (result) => {
        if (result.outcome === 'merge') return onMerge(result.into);
        onClose();
        await refreshAll();
      },
    }),
  );
  const name = tagName(value);
  const save = () => {
    if (!name || name === tag.name) return onClose();
    rename.mutate({ id: tag.id, name });
  };

  return (
    <Sheet
      visible
      title={t('tagActions.renameTitle')}
      closeLabel={t('tagActions.close')}
      onClose={onClose}
      primary={{ label: t('tagActions.save'), onPress: save, busy: rename.isPending, disabled: !name }}
    >
      <TextField
        label={t('tagActions.newName')}
        labelHidden
        autoFocus
        selectTextOnFocus
        value={value}
        onChangeText={setValue}
        onSubmitEditing={save}
        submitBehavior="submit"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        placeholder={t('tagActions.newName')}
      />
      <Text style={styles.hint}>{t('tagActions.renameHint')}</Text>
      {rename.isError && <Text style={styles.error}>{t('tagActions.failed')}</Text>}
    </Sheet>
  );
}

function PickTarget({ tag, onPick, onClose }: { tag: TagRef; onPick: (into: TagRef) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const tags = useQuery(trpc.tags.list.queryOptions({ sort: 'name' }));
  const [filter, setFilter] = useState('');
  // As loose as the Tag picker: "hilafet" finds "Hilâfet".
  const key = tagSuggestKey(tagName(filter));
  const shown = (tags.data ?? []).filter((other) => other.id !== tag.id && tagSuggestKey(other.name).includes(key));

  return (
    <Sheet
      visible
      title={t('tagActions.mergeTitle', { name: tag.name })}
      closeLabel={t('tagActions.close')}
      onClose={onClose}
    >
      <TextField
        label={t('tagActions.filter')}
        labelHidden
        placeholder={t('tagActions.filter')}
        value={filter}
        onChangeText={setFilter}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {tags.isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.status} />
      ) : tags.isError ? (
        <Text style={[styles.lead, styles.status]}>{t('tags.loadFailed')}</Text>
      ) : shown.length === 0 ? (
        <Text style={[styles.lead, styles.status]}>{t('tagActions.noMatches')}</Text>
      ) : (
        // The sheet scrolls; a list inside it would be a scroller in a scroller.
        <View>
          {shown.map((other, index) => (
            <Pressable
              key={other.id}
              role="button"
              onPress={() => onPick({ id: other.id, name: other.name })}
              style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
            >
              <Text style={styles.name}>{other.name}</Text>
              <Text style={styles.counts}>
                {t('tags.counts', { notes: other.noteCount, sources: other.sourceCount })}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Sheet>
  );
}

function ConfirmMerge({ tag, into, onClose }: { tag: TagRef; into: TagRef; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const refreshAll = useRefreshAll();
  const merge = useMutation(
    trpc.tags.merge.mutationOptions({
      onSuccess: async (kept) => {
        onClose();
        // No Geri al for a merge (#3): only a word on how it went.
        offerUndo({ message: t('tagActions.merged', { name: kept.name }) });
        await refreshAll();
      },
    }),
  );
  return (
    <Dialog
      visible
      message={
        <DialogMessage>
          <Trans
            i18nKey="tagActions.confirmMerge"
            values={{ name: tag.name, into: into.name }}
            components={{ tag: <Text style={styles.strong} /> }}
          />
          {merge.isError && <Text style={styles.error}>{`\n${t('tagActions.failed')}`}</Text>}
        </DialogMessage>
      }
      confirmLabel={t('tagActions.confirmMergeAction')}
      destructive
      cancelLabel={t('tagActions.cancel')}
      busy={merge.isPending}
      onConfirm={() => merge.mutate({ id: tag.id, intoId: into.id })}
      onCancel={onClose}
    />
  );
}

function ConfirmDelete({ tag, onClose }: { tag: TagRef; onClose: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const refreshAll = useRefreshAll();
  const impact = useQuery(trpc.tags.deleteImpact.queryOptions({ id: tag.id }, { gcTime: 0 }));
  const remove = useMutation(
    trpc.tags.delete.mutationOptions({
      onSuccess: async ({ undoToken }) => {
        onClose();
        offerServerUndo(t('tagActions.deleted', { name: tag.name }), undoToken);
        await refreshAll();
      },
    }),
  );

  const counts: string[] = [];
  if (impact.data?.notes) counts.push(t('tagActions.fromNotes', { count: impact.data.notes }));
  if (impact.data?.sources) counts.push(t('tagActions.fromSources', { count: impact.data.sources }));
  if (impact.data?.collections) counts.push(t('tagActions.fromCollections', { count: impact.data.collections }));
  // Inside the dialog's Text: words only, no spinner.
  const message = impact.isPending ? (
    t('tagActions.counting')
  ) : impact.isError ? (
    t('tagActions.failed')
  ) : counts.length ? (
    <Trans
      i18nKey="tagActions.confirmDelete"
      values={{ name: tag.name, from: joinTr(counts, t('tagActions.and')) }}
      components={{ tag: <Text style={styles.strong} /> }}
    />
  ) : (
    <Trans
      i18nKey="tagActions.confirmDeleteUnused"
      values={{ name: tag.name }}
      components={{ tag: <Text style={styles.strong} /> }}
    />
  );

  return (
    <Dialog
      visible
      message={
        <DialogMessage>
          {message}
          {remove.isError && <Text style={styles.error}>{`\n${t('tagActions.failed')}`}</Text>}
        </DialogMessage>
      }
      confirmLabel={t('tagActions.confirmDeleteAction')}
      destructive
      cancelLabel={t('tagActions.cancel')}
      busy={remove.isPending || !impact.isSuccess}
      onConfirm={() => remove.mutate({ id: tag.id })}
      onCancel={onClose}
    />
  );
}

/** "212 nottan, 3 kaynaktan ve 2 dosyadan". */
function joinTr(parts: string[], and: string) {
  if (parts.length < 2) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} ${and} ${parts[parts.length - 1]}`;
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    more: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    moreText: { ...typeScale.more, color: c.muted },
    pressed: { opacity: 0.7 },
    hint: { ...typeScale.caption, color: c.muted },
    error: { ...typeScale.body, color: c.danger },
    row: { gap: 3, paddingVertical: 12 },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    name: { ...typeScale.body, color: c.fg },
    counts: { ...typeScale.count, color: c.muted },
    status: { paddingVertical: space.xl },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    strong: typeScale.strong,
  });
