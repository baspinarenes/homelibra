import type { AppRouter } from '@homelibra/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { useOffline } from '@/lib/network';
import { useTRPC } from '@/lib/trpc';
import { offerUndo } from '@/lib/undo';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

export type ReadingStatus = inferRouterOutputs<AppRouter>['sources']['get']['readingStatus'];

/**
 * The Reading status button in the Source page's heading (#13): "okunuyor"
 * or "✓ bitti", one tap turns it to the other. Finishing a Source with
 * untagged Notes since its last "Bitir" offers "Şimdi düzenle / Sonra"
 * once, there and then; nothing reminds later. Online only.
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
        // Ana sayfa's card and Okunuyor, Kaynaklar's sections and Düzenlenecekler's order all follow it.
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

/** "N etiketsiz not var. Şimdi düzenle / Sonra": the sheet a finished Source may bring up. */
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
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('readingStatus.later')}
          style={styles.dismiss}
          onPress={onLater}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <Text style={styles.message}>{t('readingStatus.untagged', { count })}</Text>
          <View style={styles.actions}>
            <SecondaryButton label={t('readingStatus.later')} onPress={onLater} />
            <PrimaryButton label={t('readingStatus.organizeNow')} onPress={onOrganize} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** "bitti" beside a finished Source in a list that mixes both (Düzenlenecekler). */
export function FinishedMark() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.mark}>{t('readingStatus.finished')}</Text>;
}

/**
 * A list section's head, "OKUNUYOR · 4"; with `onToggle`, a fold that opens
 * and closes the section ("▸ BİTTİ · 12").
 */
export function StatusSectionHeader({
  label,
  count,
  open,
  onToggle,
}: {
  label: string;
  count: number;
  open?: boolean;
  onToggle?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const text = `${onToggle ? `${open ? '▾' : '▸'} ` : ''}${label} · ${count}`.toLocaleUpperCase('tr');
  if (!onToggle) return <Text style={styles.section}>{text}</Text>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onToggle}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Text style={styles.section}>{text}</Text>
    </Pressable>
  );
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
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    sheet: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      gap: space.xl,
      paddingHorizontal: space.lg,
      paddingTop: space.xl,
      backgroundColor: c.page,
      borderTopLeftRadius: radius.hero,
      borderTopRightRadius: radius.hero,
    },
    message: { ...typeScale.body, color: c.fg },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.md },
    mark: {
      ...typeScale.caption,
      color: c.accent,
      backgroundColor: c.accentSoft,
      paddingVertical: 2,
      paddingHorizontal: space.sm,
      borderRadius: radius.chip,
      overflow: 'hidden',
    },
    section: { ...typeScale.micro, color: c.muted, paddingTop: space.lg, paddingBottom: space.xs },
  });
