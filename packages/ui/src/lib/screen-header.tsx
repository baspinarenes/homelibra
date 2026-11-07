import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconComponent } from './icon';
import { Text } from './text';
import { type Colors, radius } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/**
 * The bar at the top of every screen, a tab root's and a pushed one's alike
 * (#139): the back arrow when there is one, the title in mono right beside
 * it on one line, the actions at the right, a 1px `line` rule underneath.
 * The bar is 44 high with icons or without, so the title stands at the same
 * height on every screen. The title is the page's kind, never a name the
 * scholar wrote: a Collection's page says DOSYA and sets its name in full
 * under the rule.
 */
export function ScreenHeader({
  title,
  onBack,
  backLabel,
  titleAccessory,
  right,
}: {
  /** Text, set in upper case ("GENEL BAKIŞ"), or a node of the screen's own in the title's place. */
  title: ReactNode;
  /** Shows the back arrow (pushed screens). */
  onBack?: () => void;
  /** What screen readers call the back arrow; needed with `onBack`. */
  backLabel?: string;
  /** An icon right beside the title (Ara's Arama ipuçları), the actions still at the right. */
  titleAccessory?: ReactNode;
  /** The actions: `HeaderTextAction`s and `HeaderIconAction`s. */
  right?: ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: top + 6 }]}>
      <View style={styles.bar}>
        {onBack ? (
          <Pressable role="button" aria-label={backLabel} onPress={onBack} style={styles.icon}>
            <ArrowLeft color={colors.fg} size={24} strokeWidth={1.6} />
          </Pressable>
        ) : (
          <View style={styles.noBack} />
        )}
        {typeof title === 'string' ? (
          <View style={styles.head}>
            <Text variant="screenTitle" numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {titleAccessory}
          </View>
        ) : (
          <View style={styles.slot}>{title}</View>
        )}
        {right && <View style={styles.actions}>{right}</View>}
      </View>
    </View>
  );
}

/** A word in the header (Kaydet), in `accent`; faded while disabled. */
export function HeaderTextAction({
  label,
  accessibilityLabel,
  onPress,
  disabled = false,
  busy = false,
}: {
  label: string;
  /** What screen readers call it, when more than the word ("Bu etiketten dosya yap"). */
  accessibilityLabel?: string;
  onPress: () => void;
  disabled?: boolean;
  /** Spins in place of the word (Kaydet while saving) and takes no presses. */
  busy?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const inactive = disabled || busy;
  return (
    <Pressable
      role="button"
      aria-label={accessibilityLabel ?? label}
      aria-disabled={inactive}
      aria-busy={busy || undefined}
      disabled={inactive}
      onPress={onPress}
      style={[styles.textAction, disabled && !busy && styles.off]}
    >
      {busy ? (
        <ActivityIndicator size={20} color={colors.accent} style={styles.busy} />
      ) : (
        <Text variant="action">{label}</Text>
      )}
    </Pressable>
  );
}

/**
 * An icon in the header with a 44 × 44 touch area: 20px on a pushed screen,
 * 24 on a tab root. `dot` lights a 7px `accent` dot over it (a filter is on);
 * say so in `label` too.
 */
export function HeaderIconAction({
  icon: Icon,
  label,
  onPress,
  tone = 'accent',
  size = 20,
  disabled = false,
  dot = false,
}: {
  icon: IconComponent;
  /** What screen readers call it. */
  label: string;
  onPress: () => void;
  /** `muted` for an icon that only explains (Arama ipuçları). */
  tone?: 'accent' | 'danger' | 'muted';
  size?: 20 | 24;
  disabled?: boolean;
  dot?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={[styles.icon, disabled && styles.off]}
    >
      <Icon color={colors[tone]} size={size} strokeWidth={1.6} />
      {dot && <View style={styles.dot} />}
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    header: { paddingBottom: 6, backgroundColor: c.page, borderBottomWidth: 1, borderBottomColor: c.line },
    // One height on every screen: an icon's or Kaydet's 44 touch area, or the same without them.
    // The right edge puts a tab root's 24px icons on the 22 gutter.
    bar: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 6, paddingRight: 12 },
    head: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 2 },
    title: { flexShrink: 1, paddingLeft: 2 },
    slot: { flex: 1, minWidth: 0 },
    // Without an arrow the title stands on the 22 gutter.
    noBack: { width: 12 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control },
    textAction: { height: 44, paddingHorizontal: 12, justifyContent: 'center' },
    // As wide as Kaydet, so the title does not shift while saving.
    busy: { width: 32 },
    off: { opacity: 0.45 },
    // A 2px `page` ring parts it from the icon's strokes.
    dot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 11,
      height: 11,
      borderWidth: 2,
      borderColor: c.page,
      borderRadius: radius.pill,
      backgroundColor: c.accent,
    },
  });
