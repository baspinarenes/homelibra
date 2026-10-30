import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

/** How long every Geri al in the app stays offered. */
export const undoDuration = 5000;

/** What was just done and how to take it back. A new offer replaces the one on screen. */
export type UndoOffer = { message: string; undo: () => void };

/**
 * The one Geri al bar (design system UndoToast): ink ground, paper text,
 * for {@link undoDuration} after an action that is taken back rather than
 * confirmed first. It floats just above the top edge of the view that holds
 * it, such as Capture's writing box.
 */
export function UndoBar({ offer, onDismiss }: { offer: UndoOffer | null; onDismiss: () => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { shadow } = useTheme();

  // Each offer gets the full time, also when it replaces one still showing.
  useEffect(() => {
    if (!offer) return;
    const timer = setTimeout(onDismiss, undoDuration);
    return () => clearTimeout(timer);
  }, [offer, onDismiss]);

  if (!offer) return null;
  return (
    <View role="status" style={[styles.bar, { boxShadow: shadow.lift }]}>
      <Text style={styles.message} numberOfLines={2}>
        {offer.message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onDismiss();
          offer.undo();
        }}
        style={({ pressed }) => [styles.undo, pressed && styles.pressed]}
      >
        <Text style={styles.undoLabel}>{t('undo.action')}</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      left: space.lg,
      right: space.lg,
      bottom: '100%',
      marginBottom: space.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      paddingLeft: space.lg,
      paddingRight: space.xs,
      borderRadius: radius.card,
      backgroundColor: c.fg,
    },
    message: { ...typeScale.label, flex: 1, color: c.page, paddingVertical: space.md },
    // At least 44pt to touch, as the design system asks.
    undo: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: space.md },
    undoLabel: { ...typeScale.button, color: c.accentSoft },
    pressed: { opacity: 0.7 },
  });
