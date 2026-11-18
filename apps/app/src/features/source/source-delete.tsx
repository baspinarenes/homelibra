import { withPendingNotes } from '@homelibra/outbox';
import { Dialog, DialogMessage } from '@homelibra/ui/dialog';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Trash from 'lucide-react-native/icons/trash';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useOffline } from '@/lib/network';
import { useOnlineFirst } from '@/lib/online-first';
import { useOutbox } from '@/lib/outbox';
import { refreshLibrary } from '@/lib/refresh-library';
import { useTRPC } from '@/lib/trpc';
import { offerServerUndo } from '@/lib/undo';

/**
 * Kaynağı sil (#36): a Source without Notes goes at once; one with Notes
 * asks first (`confirming`), since they go with it. Either way Geri al
 * brings it all back, offered where the scholar lands: the Source page goes
 * too. Online only: the outbox sends what it still has first, so the count
 * asked about is every Note the Source has (#58). Offline it waits
 * (`disabled`); `onFailed` hears when it did not go through.
 */
export function useDeleteSource({
  id,
  title,
  onFailed,
}: {
  id: string;
  title: string;
  onFailed: (failed: boolean) => void;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const notes = useQuery(trpc.notes.list.queryOptions({ sourceId: id }));
  const [confirming, setConfirming] = useState(false);
  const { state } = useOutbox();
  const offline = useOffline();
  const onlineFirst = useOnlineFirst(useCallback(() => {}, []));

  const remove = useMutation(
    trpc.sources.delete.mutationOptions({
      onMutate: () => onFailed(false),
      onSuccess: async ({ undoToken }) => {
        setConfirming(false);
        if (router.canDismiss()) router.dismissAll();
        else router.replace('/sources');
        offerServerUndo(t('deletion.sourceDeleted', { title }), undoToken);
        await refreshLibrary(id);
      },
      onError: () => {
        setConfirming(false);
        onFailed(true);
      },
    }),
  );

  // With the ones still waiting in the outbox, sent before the Source goes.
  const noteCount = notes.data && withPendingNotes(id, notes.data, state.pending).length;
  const ask = () => {
    if (noteCount) setConfirming(true);
    else remove.mutate({ id });
  };

  return {
    /** Kaynağı sil pressed: it goes, or asks first. */
    ask: () => void onlineFirst(ask),
    confirming,
    confirm: () => remove.mutate({ id }),
    cancel: () => setConfirming(false),
    busy: remove.isPending,
    noteCount: noteCount ?? 0,
    // Until the Notes are counted, it cannot tell whether to ask.
    disabled: noteCount === undefined || offline,
  };
}

export type DeleteSourceState = ReturnType<typeof useDeleteSource>;

/** What Kaynağı sil asks before a Source goes with its Notes: "<title> ve 5 notu silinecek…". */
export function DeleteSourceQuestion({ title, count }: { title: string; count: number }) {
  return (
    <Trans
      i18nKey="deletion.confirmSource"
      values={{ title, count }}
      components={{ title: <Text variant="body" color="fg" className="italic" /> }}
    />
  );
}

/** Kaynağı sil in the edit page's header, the question in a dialog; it waits while the form saves. */
export function DeleteSource({
  id,
  title,
  saving,
  onFailed,
}: {
  id: string;
  title: string;
  saving: boolean;
  onFailed: (failed: boolean) => void;
}) {
  const { t } = useTranslation();
  const deletion = useDeleteSource({ id, title, onFailed });
  return (
    <>
      <HeaderIconAction
        icon={Trash}
        tone="danger"
        label={t('deletion.deleteSource')}
        onPress={deletion.ask}
        busy={deletion.busy && !deletion.confirming}
        disabled={deletion.disabled || saving}
      />
      <Dialog
        visible={deletion.confirming}
        message={
          <DialogMessage>
            <DeleteSourceQuestion title={title} count={deletion.noteCount} />
          </DialogMessage>
        }
        destructive
        confirmLabel={t('deletion.confirm')}
        cancelLabel={t('deletion.cancel')}
        busy={deletion.busy}
        onConfirm={deletion.confirm}
        onCancel={deletion.cancel}
      />
    </>
  );
}
