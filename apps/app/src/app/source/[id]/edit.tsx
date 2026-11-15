import { Text } from '@homelibra/ui/text';
import { useTheme } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { DeleteSource } from '@/features/source/source-delete';
import { sourceToDraft } from '@/features/source/source-draft';
import { SourceForm, useLeaveAfterSave } from '@/features/source/source-form';
import { useUpdateSource } from '@/features/source/source-save';
import { useTRPC } from '@/lib/trpc';

/**
 * Kaynağı düzenle, opened from the Source page, with Kaynağı sil in its
 * header. A wide Source page opens the form in place of its writing column
 * instead (#180).
 */
export default function EditSourceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const trpc = useTRPC();
  const source = useQuery(trpc.sources.get.queryOptions({ id }));
  const [deleteFailed, setDeleteFailed] = useState(false);
  const update = useUpdateSource(id, useLeaveAfterSave());

  if (source.isPending || source.isError) {
    return (
      <View className="flex-1 items-center justify-center bg-page p-xl">
        {source.isPending ? (
          <ActivityIndicator color={colors.accent} />
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
