import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconComponent } from './icon';
import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

/**
 * The bar at the top of a screen. A pushed screen's has the back arrow, the
 * title right beside it on one line and the actions at the right. A tab
 * root's has a large title and its action icons.
 */
export function ScreenHeader({
  variant = 'pushed',
  title,
  prefix,
  onBack,
  backLabel,
  right,
}: {
  variant?: 'pushed' | 'root';
  /** Text, or a node of the screen's own in the title's place (a search box). */
  title: ReactNode;
  /** Set before the title in `muted`, as "Dosya: ". */
  prefix?: string;
  /** Shows the back arrow (pushed screens). */
  onBack?: () => void;
  /** What screen readers call the back arrow; needed with `onBack`. */
  backLabel?: string;
  /** The actions: `HeaderTextAction`s and `HeaderIconAction`s. */
  right?: ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  const titled = typeof title === 'string';

  if (variant === 'root') {
    return (
      <View style={[styles.root, { paddingTop: top + 14 }]}>
        {titled ? (
          <Text role="heading" style={styles.rootTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.slot}>{title}</View>
        )}
        {right && <View style={styles.actions}>{right}</View>}
      </View>
    );
  }

  return (
    <View style={[styles.pushed, { paddingTop: top }]}>
      <View style={styles.bar}>
        {onBack ? (
          <Pressable role="button" aria-label={backLabel} onPress={onBack} style={styles.icon}>
            <ArrowLeft color={colors.fg} size={24} strokeWidth={1.6} />
          </Pressable>
        ) : (
          <View style={styles.noBack} />
        )}
        {titled ? (
          <Text role="heading" style={styles.title} numberOfLines={1}>
            {prefix && <Text style={styles.prefix}>{prefix}</Text>}
            {title}
          </Text>
        ) : (
          <View style={styles.slot}>{title}</View>
        )}
        {right && <View style={styles.actions}>{right}</View>}
      </View>
    </View>
  );
}

/** A word in the header (Kaydet, Düzenle), in `accent`; faded while disabled. */
export function HeaderTextAction({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      role="button"
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={[styles.textAction, disabled && styles.off]}
    >
      <Text style={styles.textActionLabel}>{label}</Text>
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
  tone?: 'accent' | 'danger';
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
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 10,
      paddingLeft: 22,
      paddingRight: 12,
      backgroundColor: c.page,
    },
    rootTitle: { ...typeScale.display, color: c.fg, flexShrink: 1 },
    pushed: { backgroundColor: c.page },
    bar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6 },
    title: { ...typeScale.screenTitle, color: c.fg, flex: 1, minWidth: 0, paddingLeft: 2 },
    prefix: { color: c.muted },
    slot: { flex: 1, minWidth: 0 },
    // Without an arrow the title keeps the root title's left edge.
    noBack: { width: 12 },
    actions: { flexDirection: 'row', alignItems: 'center' },
    icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control },
    textAction: { height: 44, paddingHorizontal: 12, justifyContent: 'center' },
    textActionLabel: { ...typeScale.action, color: c.accent },
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
