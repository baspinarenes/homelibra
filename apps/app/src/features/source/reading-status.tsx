import type { AppRouter } from '@homelibra/api';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { useOffline } from '@/lib/network';
import { useTRPC } from '@/lib/trpc';
import { offerUndo } from '@/lib/undo';

export type ReadingStatus = inferRouterOutputs<AppRouter>['sources']['get']['readingStatus'];

/**
 * The Reading status button in the Source page's heading (#13): "okunuyor"
 * or "✓ bitti", one tap turns it to the other and changes nothing else.
 * Online only.
 */
export function ReadingStatusButton({ sourceId, status }: { sourceId: string; status: ReadingStatus }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const offline = useOffline();
  const finished = status === 'finished';

  const change = useMutation(
    trpc.sources.setReadingStatus.mutationOptions({
      // Genel Bakış's Kaldığın yer and Okunuyor, and Kaynaklar's tabs follow it.
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() }),
      onError: () => offerUndo({ message: t('readingStatus.failed') }),
    }),
  );

  const toggle = () => {
    if (offline) offerUndo({ message: t('readingStatus.needsConnection') });
    else change.mutate({ id: sourceId, status: finished ? 'reading' : 'finished' });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('readingStatus.label', { status: t(`readingStatus.${status}`) })}
      accessibilityHint={finished ? t('readingStatus.toReading') : t('readingStatus.toFinished')}
      disabled={change.isPending}
      onPress={toggle}
      hitSlop={8}
      className={cx(
        'self-start rounded-chip border px-sm py-0.5',
        finished ? 'border-accent bg-accent-soft' : 'border-line',
        change.isPending ? 'opacity-70' : 'active:opacity-70',
      )}
    >
      <Text variant="caption" color={finished ? 'accent' : 'ink2'}>
        {finished ? `✓ ${t('readingStatus.finished')}` : t('readingStatus.reading')}
      </Text>
    </Pressable>
  );
}
