import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Asks before a deletion that takes more than the scholar sees, such as a
 * Source with its Notes (#36): the only kind of deletion that asks first.
 * Tapping outside cancels.
 */
export function ConfirmDialog({
  visible,
  message,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  /** Text, or Text with parts set apart (a title in italics). */
  message: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          style={styles.dismiss}
          onPress={onCancel}
        />
        <View accessibilityViewIsModal role="alertdialog" style={styles.dialog}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <SecondaryButton label={cancelLabel} onPress={onCancel} disabled={busy} />
            <PrimaryButton label={confirmLabel} onPress={onConfirm} busy={busy} destructive />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', padding: space.xl, backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    dialog: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      gap: space.xl,
      padding: space.xl,
      borderRadius: radius.card,
      backgroundColor: c.page,
    },
    message: { ...typeScale.body, color: c.fg },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.md },
  });
