import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useGiveSuggestedCover } from '@/components/isbn-suggestion';
import { OfflineNotice } from '@/components/offline-notice';
import { draftToInput, emptyDraft, type SourceDraft, SourceForm, useLeaveAfterSave } from '@/components/source-form';
import { useOffline } from '@/lib/network';
import { trpcClient } from '@/lib/trpc';

/**
 * Yeni kaynak: from Kaynaklar and from Ana sayfa's "İlk kaynağını ekle".
 * Online only: the outbox carries Notes, not Sources (#58).
 */
export default function NewSourceScreen() {
  const { t } = useTranslation();
  const offline = useOffline();
  const giveCover = useGiveSuggestedCover();
  const create = useMutation({
    mutationFn: async (draft: SourceDraft) => {
      const { id } = await trpcClient.sources.create.mutate(draftToInput(draft));
      await giveCover(id, draft.suggestedCover);
    },
    onSuccess: useLeaveAfterSave(),
  });

  return (
    <SourceForm
      screenTitle={t('sourceForm.newTitle')}
      initial={emptyDraft}
      saving={create.isPending}
      failed={create.isError && !offline}
      onSave={(draft) => !offline && create.mutate(draft)}
      footer={<OfflineNotice message={t('outbox.addSourceNeedsConnection')} />}
    />
  );
}
