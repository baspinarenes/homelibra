import { type ReactNode, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './button';
import type { IconComponent } from './icon';
import { useKeyboardTop } from './keyboard';
import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

type Action = { label: string; onPress: () => void; disabled?: boolean };

/** How far a drag on the handle or the title must go down before the sheet closes. */
const dismissDistance = 80;

/**
 * A sheet from the bottom of the screen, the same in every flow: the handle,
 * the title and "Kapat" always in one place. "Kapat", a drag down and a tap on
 * the dimmed screen close it; there is never a second close button. It stops
 * 48 below the top, and what does not fit scrolls inside it. With the
 * keyboard up it stands on the keyboard, its field and the action in sight.
 * A sheet that `fill`s is a list to choose from under a field: it stands at
 * its full height while the list narrows, and the list scrolls itself.
 */
export function Sheet({
  visible,
  title,
  closeLabel,
  onClose,
  onHidden,
  primary,
  secondary,
  fill = false,
  children,
}: {
  visible: boolean;
  /** Wraps onto a second line when long. */
  title: string;
  /** "Kapat", from the app's copy. */
  closeLabel: string;
  onClose: () => void;
  /** Once the sheet has gone (web and iOS): the place to give focus back. */
  onHidden?: () => void;
  /** The main action, full width at the foot. */
  primary?: Action & { busy?: boolean; destructive?: boolean };
  /** A second action, narrow at the main one's left (1 : 2). */
  secondary?: Action;
  /**
   * Full height, the body laid out in the space left (a field above a
   * FlatList that takes the rest) instead of in the sheet's own scroll.
   */
  fill?: boolean;
  children: ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const keyboardTop = useKeyboardTop();
  const { height } = useWindowDimensions();
  const drag = useRef(new Animated.Value(0)).current;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > dismissDistance || g.vy > 0.5) onClose();
          Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [drag, onClose],
  );

  // Above the keyboard when it is up, above the navigation bar otherwise.
  const bottom = keyboardTop > 0 ? keyboardTop + 14 : Math.max(insets.bottom, 14);
  const tallest = height - insets.top - 48;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onDismiss={onHidden}
    >
      <View style={styles.backdrop}>
        <Pressable aria-hidden style={styles.dismiss} onPress={onClose} />
        <Animated.View
          role="dialog"
          aria-modal
          aria-label={title}
          style={[
            styles.sheet,
            fill ? { height: tallest } : { maxHeight: tallest },
            { paddingBottom: bottom },
            { transform: [{ translateY: drag }] },
          ]}
        >
          <View {...pan.panHandlers} style={styles.top}>
            <View style={styles.handle} />
            <View style={styles.head}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              <View style={styles.close}>
                <Button label={closeLabel} variant="text" onPress={onClose} />
              </View>
            </View>
          </View>
          {fill ? (
            <View style={[styles.body, styles.filled]}>{children}</View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {children}
            </ScrollView>
          )}
          {(primary || secondary) && (
            <View style={styles.footer}>
              {secondary && (
                <View style={styles.secondary}>
                  <Button {...secondary} variant="secondary" block />
                </View>
              )}
              {primary && (
                <View style={styles.primary}>
                  <Button
                    label={primary.label}
                    onPress={primary.onPress}
                    disabled={primary.disabled}
                    busy={primary.busy}
                    variant={primary.destructive ? 'danger' : 'primary'}
                    block
                  />
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * A row in a sheet that does one thing (Kapağı değiştir): an icon and a word
 * on a 52px line, a thin rule above. A destructive one is red and goes last.
 */
export function SheetAction({
  icon: Icon,
  label,
  onPress,
  destructive = false,
  disabled = false,
}: {
  icon: IconComponent;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const ink = destructive ? colors.danger : colors.fg;
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, disabled && styles.off, pressed && styles.pressed]}
    >
      <Icon color={ink} size={20} strokeWidth={1.6} />
      <Text style={[styles.actionLabel, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    sheet: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      gap: 14,
      paddingTop: 8,
      paddingHorizontal: 22,
      backgroundColor: c.page,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
    },
    top: { gap: 14 },
    handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: c.faint, marginBottom: 2 },
    head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    // One line of title stands in the middle of Kapat's 44pt touch area; a
    // second line goes below, Kapat staying on the first one's baseline.
    title: { ...typeScale.sourceTitle, color: c.fg, flex: 1, paddingTop: 10, paddingBottom: 9 },
    close: { marginTop: 2, marginBottom: -2 },
    scroll: { flexGrow: 0, flexShrink: 1 },
    body: { gap: 14 },
    filled: { flex: 1 },
    footer: { flexDirection: 'row', gap: 8 },
    secondary: { flex: 1 },
    primary: { flex: 2 },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 52,
      borderTopWidth: 1,
      borderTopColor: c.lineSoft,
    },
    actionLabel: { ...typeScale.body },
    off: { opacity: 0.45 },
    pressed: { opacity: 0.7 },
  });
