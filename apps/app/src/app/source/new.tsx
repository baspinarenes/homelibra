import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { draftToInput, emptyDraft, SourceForm, useLeaveAfterSave } from '@/components/source-form';
import { useTRPC } from '@/lib/trpc';

/** Yeni kaynak: from Kaynaklar and from Ana sayfa's "İlk kaynağını ekle". */
export default function NewSourceScreen() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const create = useMutation(trpc.sources.create.mutationOptions({ onSuccess: useLeaveAfterSave() }));

  return (
    <SourceForm
      screenTitle={t('sourceForm.newTitle')}
      initial={emptyDraft}
      saving={create.isPending}
      failed={create.isError}
      onSave={(draft) => create.mutate(draftToInput(draft))}
    />
  );
}
