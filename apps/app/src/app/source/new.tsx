import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useGiveSuggestedCover } from '@/components/isbn-suggestion';
import { draftToInput, emptyDraft, type SourceDraft, SourceForm, useLeaveAfterSave } from '@/components/source-form';
import { trpcClient } from '@/lib/trpc';

/**
 * Yeni kaynak: from Kaynaklar and from Genel bakış's "İlk kaynağını ekle".
 * Online only: the outbox carries Notes, not Sources (#58).
 */
export default function NewSourceScreen() {
  const { t } = useTranslation();
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
      failed={create.isError}
      offlineNotice={t('outbox.addSourceNeedsConnection')}
      onSave={(draft) => create.mutate(draft)}
    />
  );
}
