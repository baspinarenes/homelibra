import { withPendingNotes } from '@homelibra/outbox';
import { Dialog, DialogMessage } from '@homelibra/ui/dialog';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { Text } from '@homelibra/ui/text';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Trash from 'lucide-react-native/icons/trash';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useGiveSuggestedCover } from '@/components/isbn-suggestion';
import { draftToInput, type SourceDraft, SourceForm, sourceToDraft, useLeaveAfterSave } from '@/components/source-form';
import { useOffline } from '@/lib/network';
import { useOnlineFirst } from '@/lib/online-first';
import { useOutbox } from '@/lib/outbox';
import { refreshLibrary } from '@/lib/refresh-library';
import { trpcClient, useTRPC } from '@/lib/trpc';
import { offerServerUndo } from '@/lib/undo';

/** Kaynağı düzenle, opened from the Source page, with Kaynağı sil in its header. */
export default function EditSourceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const source = useQuery(trpc.sources.get.queryOptions({ id }));
  const giveCover = useGiveSuggestedCover();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const update = useMutation({
    mutationFn: async (draft: SourceDraft) => {
      await trpcClient.sources.update.mutate({ id, ...draftToInput(draft) });
      await giveCover(id, draft.suggestedCover);
    },
    onSuccess: useLeaveAfterSave(),
  });

  if (source.isPending || source.isError) {
    return (
      <View style={styles.center}>
        {source.isPending ? (
          <ActivityIndicator color={styles.spinner.color} />
        ) : (
          <Text variant="body">{t('sourceForm.loadFailed')}</Text>
        )}
      </View>
    );
  }

  return (
    <SourceForm
      key={id}
      screenTitle={t('sourceForm.editTitle')}
      initial={sourceToDraft(source.data)}
      saving={update.isPending}
      failed={update.isError}
      deleteFailed={deleteFailed}
      offlineNotice={t('outbox.editSourceNeedsConnection')}
      onSave={(draft) => update.mutate(draft)}
      deleteAction={
        <DeleteSource id={id} title={source.data.title} saving={update.isPending} onFailed={setDeleteFailed} />
      }
    />
  );
}

/**
 * Kaynağı sil (#36): a Source without Notes goes at once; one with Notes
 * asks first, since they go with it. Either way Geri al brings it all back,
 * offered where the scholar lands: the Source page goes too. Online only:
 * the outbox sends what it still has first, so the count asked about is
 * every Note the Source has (#58). Offline, and while the form saves, it
 * waits; the strip under the header says why offline, and when it failed.
 */
function DeleteSource({
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
  const styles = useThemedStyles(makeStyles);
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

  return (
    <>
      <HeaderIconAction
        icon={Trash}
        tone="danger"
        label={t('deletion.deleteSource')}
        onPress={() => void onlineFirst(ask)}
        busy={remove.isPending && !confirming}
        // Until the Notes are counted, it cannot tell whether to ask.
        disabled={noteCount === undefined || offline || saving}
      />
      <Dialog
        visible={confirming}
        message={
          <DialogMessage>
            <Trans
              i18nKey="deletion.confirmSource"
              values={{ title, count: noteCount ?? 0 }}
              components={{ title: <Text variant="body" color="fg" style={styles.title} /> }}
            />
          </DialogMessage>
        }
        destructive
        confirmLabel={t('deletion.confirm')}
        cancelLabel={t('deletion.cancel')}
        busy={remove.isPending}
        onConfirm={() => remove.mutate({ id })}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    spinner: { color: c.accent },
    title: { fontStyle: 'italic' },
  });
