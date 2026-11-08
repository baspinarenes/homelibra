import { space } from '@homelibra/ui/theme';
import { Toast } from '@homelibra/ui/toast';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { offerUndo, type UndoOffer, useUndoOffer } from '@/lib/undo';

export type { UndoOffer } from '@/lib/undo';

/** How long every Geri al in the app stays offered. */
export const undoDuration = 5000;

/**
 * The one Geri al bar, the package's Toast, for {@link undoDuration} after
 * an action that is taken back rather than confirmed first. It floats just
 * above the top edge of the view that holds it, such as "Not al" or the
 * writing sheet's "+ etiket" line.
 */
export function UndoBar({ offer, onDismiss }: { offer: UndoOffer | null; onDismiss: () => void }) {
  const { t } = useTranslation();

  // Each offer gets the full time, also when it replaces one still showing.
  useEffect(() => {
    if (!offer) return;
    const timer = setTimeout(onDismiss, undoDuration);
    return () => clearTimeout(timer);
  }, [offer, onDismiss]);

  if (!offer) return null;
  const { undo } = offer;
  return (
    <View pointerEvents="box-none" style={styles.edge}>
      <View pointerEvents="box-none" style={styles.place}>
        <Toast
          message={offer.message}
          action={
            undo
              ? {
                  label: t('undo.action'),
                  onPress: () => {
                    onDismiss();
                    undo();
                  },
                }
              : undefined
          }
        />
      </View>
    </View>
  );
}

/**
 * The bar for the app's one shared offer ({@link offerUndo}), shown only
 * while its screen is in front, so a screen left for another still hands
 * its Geri al over to the one the scholar sees.
 */
export function SharedUndoBar() {
  const offer = useUndoOffer();
  const focused = useIsFocused();
  const dismiss = useCallback(() => offerUndo(null), []);
  return <UndoBar offer={focused ? offer : null} onDismiss={dismiss} />;
}

// Just above the top edge of the view that holds it; the Toast keeps 16 from the screen's sides.
// Not `bottom: '100%'`: React Native takes that against the holder's height
// less its padding, which sank the bar into the view under it. A zero-height
// edge on the holder's top needs no percentage.
const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, top: 0, height: 0 },
  place: { position: 'absolute', left: 0, right: 0, bottom: 0, marginBottom: space.md },
});
