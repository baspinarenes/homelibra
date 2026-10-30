import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { draftToInput, SourceForm, sourceToDraft, useLeaveAfterSave } from '@/components/source-form';
import { useTRPC } from '@/lib/trpc';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** Kaynağı düzenle. The Source page arrives later; until then a Kaynaklar row opens this. */
export default function EditSourceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const source = useQuery(trpc.sources.get.queryOptions({ id }));
  const update = useMutation(trpc.sources.update.mutationOptions({ onSuccess: useLeaveAfterSave() }));

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
      onSave={(draft) => update.mutate({ id, ...draftToInput(draft) })}
    />
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, backgroundColor: c.page },
    lead: { ...typeScale.body, color: c.ink2 },
    spinner: { color: c.accent },
  });
