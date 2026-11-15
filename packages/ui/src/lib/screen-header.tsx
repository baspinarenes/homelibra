import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cx } from './cx';
import type { IconComponent } from './icon';
import { Text } from './text';
import { useTheme } from './use-theme';

// An icon's 44 × 44 touch area.
const icon = 'h-11 w-11 items-center justify-center rounded-control';

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
  const { colors } = useTheme();
  const { top } = useSafeAreaInsets();
  return (
    <View className="border-b border-line bg-page pb-1.5" style={{ paddingTop: top + 6 }}>
      {/* One height on every screen: an icon's or Kaydet's 44 touch area, or the same without them.
          The right edge puts a tab root's 24px icons on the 22 gutter. */}
      <View className="h-11 flex-row items-center gap-0.5 pl-1.5 pr-3">
        {onBack ? (
          <Pressable role="button" aria-label={backLabel} onPress={onBack} className={icon}>
            <ArrowLeft color={colors.fg} size={24} strokeWidth={1.6} />
          </Pressable>
        ) : (
          // Without an arrow the title stands on the 22 gutter.
          <View className="w-3" />
        )}
        {typeof title === 'string' ? (
          <View className="min-w-0 flex-1 flex-row items-center gap-0.5">
            <Text variant="screenTitle" numberOfLines={1} className="shrink pl-0.5">
              {title}
            </Text>
            {titleAccessory}
          </View>
        ) : (
          <View className="min-w-0 flex-1">{title}</View>
        )}
        {right && <View className="flex-row items-center">{right}</View>}
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
      className={cx('h-11 justify-center px-3', disabled && !busy && 'opacity-45')}
    >
      {busy ? (
        // As wide as Kaydet, so the title does not shift while saving.
        <ActivityIndicator size={20} color={colors.accent} className="w-8" />
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
  busy = false,
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
  /** Spins in place of the icon (Kaydet while saving) and takes no presses. */
  busy?: boolean;
  dot?: boolean;
}) {
  const { colors } = useTheme();
  const inactive = disabled || busy;
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={inactive}
      aria-busy={busy || undefined}
      disabled={inactive}
      onPress={onPress}
      className={cx(icon, disabled && !busy && 'opacity-45')}
    >
      {busy ? (
        <ActivityIndicator size={size} color={colors[tone]} />
      ) : (
        <Icon color={colors[tone]} size={size} strokeWidth={1.6} />
      )}
      {/* A 2px `page` ring parts it from the icon's strokes. */}
      {dot && <View className="absolute top-2 right-2 h-2.75 w-2.75 rounded-pill border-2 border-page bg-accent" />}
    </Pressable>
  );
}
