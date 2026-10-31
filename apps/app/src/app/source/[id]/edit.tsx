import { withPendingNotes } from '@homelibra/outbox';
import { Button } from '@homelibra/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { useGiveSuggestedCover } from '@/components/isbn-suggestion';
import { draftToInput, type SourceDraft, SourceForm, sourceToDraft, useLeaveAfterSave } from '@/components/source-form';
import { useOffline } from '@/lib/network';
import { useOnlineFirst } from '@/lib/online-first';
import { useOutbox } from '@/lib/outbox';
import { refreshLibrary } from '@/lib/refresh-library';
import { trpcClient, useTRPC } from '@/lib/trpc';
import { offerServerUndo } from '@/lib/undo';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** Kaynağı düzenle, opened from the Source page, with Kaynağı sil at its foot. */
export default function EditSourceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const source = useQuery(trpc.sources.get.queryOptions({ id }));
  const giveCover = useGiveSuggestedCover();
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
          <Text style={styles.lead}>{t('sourceForm.loadFailed')}</Text>
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
      offlineNotice={t('outbox.editSourceNeedsConnection')}
      onSave={(draft) => update.mutate(draft)}
      footer={<DeleteSource id={id} title={source.data.title} saving={update.isPending} />}
    />
  );
}

/**
 * Kaynağı sil (#36): a Source without Notes goes at once; one with Notes
 * asks first, since they go with it. Either way Geri al brings it all back,
 * offered where the scholar lands: the Source page goes too. Online only:
 * the outbox sends what it still has first, so the count asked about is
 * every Note the Source has (#58). Offline, and while the form saves, it
 * waits; the strip under the header says why offline.
 */
function DeleteSource({ id, title, saving }: { id: string; title: string; saving: boolean }) {
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
      onSuccess: async ({ undoToken }) => {
        setConfirming(false);
        if (router.canDismiss()) router.dismissAll();
        else router.replace('/sources');
        offerServerUndo(t('deletion.sourceDeleted', { title }), undoToken);
        await refreshLibrary(id);
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
    <View style={styles.foot}>
      {remove.isError && <Text style={styles.error}>{t('deletion.deleteFailed')}</Text>}
      <Button
        variant="text"
        tone="danger"
        label={t('deletion.deleteSource')}
        onPress={() => void onlineFirst(ask)}
        busy={remove.isPending && !confirming}
        // Until the Notes are counted, it cannot tell whether to ask.
        disabled={noteCount === undefined || offline || saving}
      />
      <ConfirmDialog
        visible={confirming}
        message={
          <Trans
            i18nKey="deletion.confirmSource"
            values={{ title, count: noteCount ?? 0 }}
            components={{ title: <Text style={styles.title} /> }}
          />
        }
        confirmLabel={t('deletion.confirm')}
        cancelLabel={t('deletion.cancel')}
        busy={remove.isPending}
        onConfirm={() => remove.mutate({ id })}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2 },
    spinner: { color: c.accent },
    foot: { gap: space.sm, marginTop: space.lg, alignItems: 'center' },
    error: { ...typeScale.body, color: c.danger },
    title: { fontStyle: 'italic' },
  });
