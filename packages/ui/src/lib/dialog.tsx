import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from './button';
import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/**
 * A question in the middle of the screen, before a step that takes more than
 * the scholar sees. Confirmations are never sheets. The answers stand at the
 * right, the main or destructive one last; tapping outside cancels.
 */
export function Dialog({
  visible,
  message,
  cancelLabel,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  /** Text, or Text with parts set apart (a title in italics). */
  message: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  /** The answer cannot be taken back: the confirm button is `danger`. */
  destructive?: boolean;
  /** The confirmed step is under way. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { shadow } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {/* Screen readers answer with the buttons; the dimmed screen is for a tap. */}
        <Pressable aria-hidden style={styles.dismiss} onPress={onCancel} />
        <View aria-modal role="alertdialog" style={[styles.dialog, { boxShadow: shadow.lift }]}>
          {typeof message === 'string' ? <Text style={styles.message}>{message}</Text> : message}
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="secondary" disabled={busy} onPress={onCancel} />
            <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} busy={busy} onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** The dialog's body text, for a message with parts set apart. */
export function DialogMessage({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.message}>{children}</Text>;
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    dialog: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      gap: 24,
      padding: 24,
      borderRadius: radius.control,
      backgroundColor: c.page,
    },
    message: { ...typeScale.body, color: c.fg },
    // When the two do not fit side by side, they go one under the other.
    actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  });
