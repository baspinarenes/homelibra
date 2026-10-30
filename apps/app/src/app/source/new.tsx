import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { OfflineNotice } from '@/components/offline-notice';
import { draftToInput, emptyDraft, SourceForm, useLeaveAfterSave } from '@/components/source-form';
import { useOffline } from '@/lib/network';
import { useTRPC } from '@/lib/trpc';

/**
 * Yeni kaynak: from Kaynaklar and from Ana sayfa's "İlk kaynağını ekle".
 * Online only: the outbox carries Notes, not Sources (#58).
 */
export default function NewSourceScreen() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const offline = useOffline();
  const create = useMutation(trpc.sources.create.mutationOptions({ onSuccess: useLeaveAfterSave() }));

  return (
    <SourceForm
      screenTitle={t('sourceForm.newTitle')}
      initial={emptyDraft}
      saving={create.isPending}
      failed={create.isError && !offline}
      onSave={(draft) => !offline && create.mutate(draftToInput(draft))}
      footer={<OfflineNotice message={t('outbox.addSourceNeedsConnection')} />}
    />
  );
}
