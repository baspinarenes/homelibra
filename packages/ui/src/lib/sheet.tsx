import X from 'lucide-react-native/icons/x';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './button';
import type { IconComponent } from './icon';
import { useKeyboardTop } from './keyboard';
import { Text } from './text';
import { type Colors, radius } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

type Action = { label: string; onPress: () => void; disabled?: boolean };

/**
 * How long after Android shows the sheet its window takes the keyboard, in
 * ms: a field focused sooner gets a caret but no keyboard.
 */
const keyboardReadyAfter = 100;

/** How far a drag on the handle or the title must go down before the sheet closes. */
const dismissDistance = 80;

/**
 * A sheet from the bottom of the screen, the same in every flow: the handle,
 * the title and its X always in one place. The X (named "Kapat" for screen
 * readers), a drag down and a tap on the dimmed screen close it; there is
 * never a second close button. It stops 48 below the top, and what does not
 * fit scrolls inside it. Its foot keeps 14 clear of the phone's navigation
 * bar. With the keyboard up it stands on the keyboard, its field and the
 * action in sight.
 * A sheet that `fill`s is a list to choose from under a field, or a page to
 * write on: it stands at its full height while what it holds narrows, and
 * that scrolls itself.
 * A sheet with a `header` of its own (Vazgeç · Yeni Not · Kaydet) has it in
 * place of the title and the X, under the handle; a drag down on it closes
 * the sheet as on the title.
 */
export function Sheet({
  visible,
  title,
  closeLabel,
  header,
  onClose,
  onShown,
  onHidden,
  primary,
  secondary,
  fill = false,
  children,
}: (
  | {
      /** What screen readers call the X: "Kapat", from the app's copy. */
      closeLabel: string;
      header?: never;
    }
  | {
      closeLabel?: never;
      /** The sheet's own top line, its way out among its buttons. */
      header: ReactNode;
    }
) & {
  visible: boolean;
  /** Wraps onto a second line when long; with a `header`, only what screen readers call the sheet. */
  title: string;
  /** The X, a drag down, the dimmed screen and Android's back all come here: a question may stand between. */
  onClose: () => void;
  /**
   * Once the sheet is up and takes the keyboard: the place to focus a field
   * (autoFocus brings no keyboard on Android).
   */
  onShown?: () => void;
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardTop = useKeyboardTop();
  const { height } = useWindowDimensions();
  const drag = useRef(new Animated.Value(0)).current;
  // 0 gone, 1 up. The dim fades in place while the sheet slides over it, so
  // the Modal stays open until the way out has played.
  const shown = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) drag.setValue(0);
    Animated.timing(shown, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, shown, drag]);

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

  // 14 clear of the keyboard when it is up, of the navigation bar or the home indicator otherwise.
  const bottom = (keyboardTop > 0 ? keyboardTop : insets.bottom) + 14;
  const tallest = height - insets.top - 48;
  const rise = shown.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onShow={
        onShown &&
        (() => {
          setTimeout(onShown, keyboardReadyAfter);
        })
      }
      onDismiss={onHidden}
    >
      <View style={styles.frame}>
        <Animated.View style={[styles.backdrop, { opacity: shown }]}>
          <Pressable aria-hidden style={styles.dismiss} onPress={onClose} />
        </Animated.View>
        <Animated.View
          role="dialog"
          aria-modal
          aria-label={title}
          style={[
            styles.sheet,
            fill ? { height: tallest } : { maxHeight: tallest },
            { paddingBottom: bottom },
            { transform: [{ translateY: Animated.add(rise, drag) }] },
          ]}
        >
          <View {...pan.panHandlers} style={styles.top}>
            <View style={styles.handle} />
            {header ?? (
              <View style={styles.head}>
                <Text variant="sourceTitle" style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
                <Pressable
                  role="button"
                  aria-label={closeLabel}
                  onPress={onClose}
                  style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                >
                  <X color={colors.fg} size={24} strokeWidth={1.6} />
                </Pressable>
              </View>
            )}
          </View>
          {fill ? (
            <View style={[styles.body, styles.filled]}>{children}</View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.body, styles.scrolled]}
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
  const ink = destructive ? 'danger' : 'fg';
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.action, disabled && styles.off, pressed && styles.pressed]}
    >
      <Icon color={colors[ink]} size={20} strokeWidth={1.6} />
      <Text variant="body" color={ink}>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    frame: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: c.scrim },
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
    // One line of title stands in the middle of the X's 44pt touch area; a
    // second line goes below, the X staying beside the first one.
    title: { flex: 1, paddingTop: 10, paddingBottom: 9 },
    // The touch area reaches past the gutter so the X itself stands on it.
    close: {
      width: 44,
      height: 44,
      marginTop: 2,
      marginBottom: -2,
      marginRight: -10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.control,
    },
    // The scroll clips what it holds: it reaches 4 past the body on every side, so a field at the
    // body's edge keeps its border and its 3px focus ring.
    scroll: { flexGrow: 0, flexShrink: 1, margin: -4 },
    scrolled: { padding: 4 },
    body: { gap: 14 },
    filled: { flex: 1 },
    footer: { flexDirection: 'row', gap: 8 },
    // A third for the secondary, more when its label needs it, so it never wraps; the primary takes the rest.
    secondary: { flexShrink: 0, minWidth: '33%' },
    primary: { flex: 1 },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 52,
      borderTopWidth: 1,
      borderTopColor: c.lineSoft,
    },
    off: { opacity: 0.45 },
    pressed: { opacity: 0.7 },
  });
