import { Text } from '@homelibra/ui/text';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { TagChips } from '@/components/tag-chips';
import { useOffline } from '@/lib/network';
import { useTRPC } from '@/lib/trpc';

/**
 * The Source's own Tags in the Source page's heading, with "+ etiket". They
 * stay on the Source: its Notes show only their own (ADR-0003).
 */
export function SourceTags({ sourceId, names }: { sourceId: string; names: string[] }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  // Online only: the outbox carries Notes, not a Source's Tags (#58).
  const offline = useOffline();
  const setOnSource = useMutation(
    trpc.tags.setOnSource.mutationOptions({
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.sources.get.queryKey({ id: sourceId }) }),
          queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
        ]),
    }),
  );
  // While saving, the chips show what was chosen.
  const shown = setOnSource.isPending ? setOnSource.variables.names : names;
  return (
    <View style={styles.tags}>
      <TagChips
        names={shown}
        pickerTitle={t('tags.sourceTitle')}
        onChange={(next) => setOnSource.mutate({ sourceId, names: next })}
      />
      {setOnSource.isError && (
        <Text variant="caption" color="danger">
          {t(offline ? 'outbox.needsConnection' : 'tags.saveFailed')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tags: { gap: 6 },
});
