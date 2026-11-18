import { useTranslation } from 'react-i18next';

import { emptyDraft } from '@/features/source/source-draft';
import { SourceForm, useLeaveAfterSave } from '@/features/source/source-form';
import { useCreateSource } from '@/features/source/source-save';

/**
 * Yeni kaynak: from Kaynaklar and from Genel Bakış's "İlk kaynağını ekle".
 * Online only: the outbox carries Notes, not Sources (#58). A wide
 * Kaynaklar opens the form in its panel instead (#180).
 */
export default function NewSourceScreen() {
  const { t } = useTranslation();
  const create = useCreateSource(useLeaveAfterSave());

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
