import { type ReactNode, useRef, useState } from 'react';
import { type LayoutChangeEvent, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';
import { type Colors, radius } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

const gap = 8;

/**
 * A question in the middle of the screen, before a step that takes more than
 * the scholar sees. Confirmations are never sheets. The answers stand at the
 * right, the main or destructive one last; when they do not fit in a row,
 * they go one under the other at full width, the main one first. Tapping
 * outside cancels.
 */
export function Dialog({
  visible,
  message,
  cancelLabel,
  confirmLabel,
  alternative,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  /** Text, or Text with parts set apart (a title in italics), or that and a status line under it. */
  message: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  /** A third answer, between the other two: "Yine de çık" beside "Önce gönder". */
  alternative?: { label: string; onPress: () => void };
  /** The answer cannot be taken back: the confirm button is `danger`. */
  destructive?: boolean;
  /** The confirmed step is under way. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { shadow } = useTheme();
  const stacking = useStacking();
  const block = stacking.stacked;

  const answers = [
    <Button key="cancel" label={cancelLabel} variant="secondary" block={block} disabled={busy} onPress={onCancel} />,
    alternative && (
      <Button
        key="alternative"
        label={alternative.label}
        variant="secondary"
        block={block}
        disabled={busy}
        onPress={alternative.onPress}
      />
    ),
    <Button
      key="confirm"
      label={confirmLabel}
      variant={destructive ? 'danger' : 'primary'}
      block={block}
      busy={busy}
      onPress={onConfirm}
    />,
  ].filter((answer) => answer !== undefined);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {/* Screen readers answer with the buttons; the dimmed screen is for a tap. */}
        <Pressable aria-hidden style={styles.dismiss} onPress={onCancel} />
        <View aria-modal role="alertdialog" style={[styles.dialog, { boxShadow: shadow.lift }]}>
          {typeof message === 'string' ? (
            <Text variant="body" color="fg">
              {message}
            </Text>
          ) : (
            message
          )}
          <View onLayout={stacking.onRoom} style={block ? styles.stack : styles.row}>
            {block
              ? answers.reverse()
              : answers.map((answer, index) => (
                  <View key={answer.key} onLayout={(event) => stacking.onAnswer(index, event)}>
                    {answer}
                  </View>
                ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Whether the answers go one under the other: their widths are measured side
 * by side and compared with the room the dialog gives them.
 */
function useStacking() {
  const [stacked, setStacked] = useState(false);
  const room = useRef(0);
  const widths = useRef<number[]>([]);
  const decide = () => {
    const needed = widths.current.reduce((sum, width) => sum + width, 0) + gap * (widths.current.length - 1);
    if (room.current > 0 && widths.current.length > 0) setStacked(needed > room.current);
  };
  return {
    stacked,
    onRoom: (event: LayoutChangeEvent) => {
      room.current = event.nativeEvent.layout.width;
      decide();
    },
    // Measured only side by side; stacked, an answer is as wide as the room.
    onAnswer: (index: number, event: LayoutChangeEvent) => {
      widths.current[index] = event.nativeEvent.layout.width;
      decide();
    },
  };
}

/** The dialog's body text, for a message with parts set apart. */
export function DialogMessage({ children }: { children: ReactNode }) {
  return (
    <Text variant="body" color="fg">
      {children}
    </Text>
  );
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
    row: { flexDirection: 'row', justifyContent: 'flex-end', gap },
    stack: { gap },
  });
