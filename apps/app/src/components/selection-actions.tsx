import type { ListedNote } from '@homelibra/outbox';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MergePreview } from '@/components/merge-preview';
import { type PickedSource, SourcePicker } from '@/components/source-picker';
import { refreshLibrary } from '@/lib/refresh-library';
import { useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Birleştir, Taşı and Sil for Düzenle mode's selection (#13, #36), each
 * with Geri al: `chosen` are the selected Notes, of the one Source
 * `sourceId`. Sil asks nothing. `onDone` runs once an action went through,
 * to clear the selection. Render `sheets` once: the merge preview and the
 * Source picker; `open` is true while one of them is up.
 */
export function useSelectionActions({
  sourceId,
  chosen,
  onDone,
}: {
  sourceId: string;
  chosen: ListedNote[];
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const [merging, setMerging] = useState<ListedNote[] | null>(null);
  const [moving, setMoving] = useState(false);

  // Where the Notes were, went or came back.
  const refresh = () => refreshLibrary();

  const deleteMany = useMutation(
    trpc.notes.deleteMany.mutationOptions({
      onSuccess: async ({ count, undoToken }) => {
        onDone();
        offerServerUndo(t('selection.deleted', { count }), undoToken);
        await refresh();
      },
    }),
  );
  const moveNotes = useMutation(trpc.notes.moveMany.mutationOptions());
  const moveMany = useMutation({
    mutationFn: async ({ ids, to }: { ids: string[]; to: PickedSource }) => ({
      to,
      ...(await moveNotes.mutateAsync({ ids, sourceId: to.id })),
    }),
    onSuccess: async ({ to, count, undoToken }) => {
      onDone();
      offerServerUndo(t('selection.moved', { count, title: to.title }), undoToken);
      await refresh();
    },
  });

  const busy = deleteMany.isPending || moveMany.isPending;
  const ids = chosen.map((n) => n.id);
  const ready = () => {
    if (chosen.length === 0) offerUndo({ message: t('selection.pickFirst') });
    return chosen.length > 0 && !busy;
  };

  return {
    count: chosen.length,
    busy,
    failed: deleteMany.isError || moveMany.isError,
    open: merging !== null || moving,
    /** Sil: at once, with Geri al. */
    remove: () => ready() && deleteMany.mutate({ ids }),
    /** Taşı: choose the Source first. */
    move: () => ready() && setMoving(true),
    /** Birleştir: the preview first. */
    merge: () => {
      if (chosen.length < 2) offerUndo({ message: t('selection.mergeNeedsTwo') });
      else if (!busy) setMerging(chosen);
    },
    sheets: (
      <>
        <MergePreview
          notes={merging}
          onClose={() => setMerging(null)}
          onMerged={async (undoToken, count) => {
            setMerging(null);
            onDone();
            offerServerUndo(t('selection.merged', { count }), undoToken);
            await refresh();
          }}
        />
        <SourcePicker
          visible={moving}
          currentId={sourceId}
          onPick={(picked) => {
            setMoving(false);
            if (picked.id !== sourceId) moveMany.mutate({ ids, to: picked });
          }}
          onClose={() => setMoving(false)}
        />
      </>
    ),
  };
}

export type SelectionActions = ReturnType<typeof useSelectionActions>;

/** The selection bar's second line: Birleştir · Taşı · Sil, quiet until Notes are selected. */
export function SelectionActionsRow({ actions }: { actions: SelectionActions }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const none = actions.count === 0 || actions.busy;
  return (
    <View style={styles.row}>
      <Action label={t('selection.merge')} onPress={actions.merge} inactive={actions.count < 2 || actions.busy} />
      <Action label={t('selection.move')} onPress={actions.move} inactive={none} />
      <Action label={t('selection.delete')} onPress={actions.remove} inactive={none} danger />
    </View>
  );
}

function Action({
  label,
  onPress,
  inactive,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  inactive: boolean;
  danger?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.action, inactive && styles.inactive, pressed && styles.pressed]}
    >
      <Text style={[styles.label, danger && styles.danger]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
    action: { minHeight: 36, justifyContent: 'center' },
    label: { ...typeScale.button, color: c.accent },
    danger: { color: c.danger },
    inactive: { opacity: 0.45 },
    pressed: { opacity: 0.7 },
  });
