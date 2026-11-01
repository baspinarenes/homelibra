import type { AppRouter } from '@homelibra/api';
import { Sheet } from '@homelibra/ui/sheet';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useOffline } from '@/lib/network';
import { useTRPC } from '@/lib/trpc';
import { offerUndo } from '@/lib/undo';

export type ReadingStatus = inferRouterOutputs<AppRouter>['sources']['get']['readingStatus'];

/**
 * The Reading status button in the Source page's heading (#13): "okunuyor"
 * or "✓ bitti", one tap turns it to the other. Finishing a Source with
 * untagged Notes since its last "Bitir" offers "Şimdi düzenle" once,
 * there and then; nothing reminds later. Online only.
 */
export function ReadingStatusButton({
  sourceId,
  status,
  onOrganize,
}: {
  sourceId: string;
  status: ReadingStatus;
  /** Opens Düzenle mode on this Source. */
  onOrganize: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const offline = useOffline();
  // The untagged Notes Düzenle mode is offered for; the count stays while the sheet slides away.
  const [suggestion, setSuggestion] = useState({ open: false, count: 0 });
  const closeSuggestion = () => setSuggestion((current) => ({ ...current, open: false }));
  const finished = status === 'finished';

  const change = useMutation(
    trpc.sources.setReadingStatus.mutationOptions({
      onSuccess: async ({ untaggedCount }) => {
        // Genel bakış's Kaldığın yer and Okunuyor, Kaynaklar's tabs and Düzenlenecekler's order all follow it.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.organize.pathKey() }),
        ]);
        if (untaggedCount > 0) setSuggestion({ open: true, count: untaggedCount });
      },
      onError: () => offerUndo({ message: t('readingStatus.failed') }),
    }),
  );

  const toggle = () => {
    if (offline) offerUndo({ message: t('readingStatus.needsConnection') });
    else change.mutate({ id: sourceId, status: finished ? 'reading' : 'finished' });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('readingStatus.label', { status: t(`readingStatus.${status}`) })}
        accessibilityHint={finished ? t('readingStatus.toReading') : t('readingStatus.toFinished')}
        disabled={change.isPending}
        onPress={toggle}
        hitSlop={8}
        style={({ pressed }) => [
          styles.button,
          finished && styles.finished,
          (pressed || change.isPending) && styles.pressed,
        ]}
      >
        <Text style={[styles.buttonLabel, finished && styles.finishedLabel]}>
          {finished ? `✓ ${t('readingStatus.finished')}` : t('readingStatus.reading')}
        </Text>
      </Pressable>
      <FinishSuggestion
        visible={suggestion.open}
        count={suggestion.count}
        onOrganize={() => {
          closeSuggestion();
          onOrganize();
        }}
        onLater={closeSuggestion}
      />
    </>
  );
}

/**
 * "Kaynak bitti · N etiketsiz not var. Şimdi düzenle": the sheet a finished
 * Source may bring up. Closing it leaves the Notes for later.
 */
function FinishSuggestion({
  visible,
  count,
  onOrganize,
  onLater,
}: {
  visible: boolean;
  count: number;
  onOrganize: () => void;
  onLater: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Sheet
      visible={visible}
      title={t('readingStatus.finishedTitle')}
      closeLabel={t('readingStatus.close')}
      onClose={onLater}
      primary={{ label: t('readingStatus.organizeNow'), onPress: onOrganize }}
    >
      <Text style={styles.message}>{t('readingStatus.untagged', { count })}</Text>
    </Sheet>
  );
}

/** "bitti" beside a finished Source in a list that mixes both (Düzenlenecekler). */
export function FinishedMark() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.mark}>{t('readingStatus.finished')}</Text>;
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },
    button: {
      alignSelf: 'flex-start',
      paddingVertical: 2,
      paddingHorizontal: space.sm,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.chip,
    },
    finished: { borderColor: c.accent, backgroundColor: c.accentSoft },
    buttonLabel: { ...typeScale.caption, color: c.ink2 },
    finishedLabel: { color: c.accent },
    message: { ...typeScale.body, color: c.fg },
    mark: {
      ...typeScale.caption,
      color: c.accent,
      backgroundColor: c.accentSoft,
      paddingVertical: 2,
      paddingHorizontal: space.sm,
      borderRadius: radius.chip,
      overflow: 'hidden',
    },
  });
