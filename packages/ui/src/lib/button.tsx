import { ActivityIndicator, Pressable } from 'react-native';

import { cx } from './cx';
import type { IconComponent } from './icon';
import { Text } from './text';
import type { Colors } from './tokens';
import { useTheme } from './use-theme';

export type ButtonVariant = 'primary' | 'danger' | 'secondary' | 'small' | 'text';

/**
 * The app's one button.
 * - `primary`: accent ground. `danger`: for the step that cannot be taken back.
 * - `secondary`: a frame, beside a primary one; with a `tone`, frame and word take that colour.
 * - `small`: a framed accent word in a row (Düzenle · 4 etiketsiz).
 * - `text`: a word alone (Çıkış yap), in `accent` or `danger`.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  tone,
  icon: Icon,
  block = false,
  onAccent = false,
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** The colour of a `text` button (accent if unset), or of a `secondary` button's frame and word. */
  tone?: 'accent' | 'danger';
  /** A lucide icon before the label. */
  icon?: IconComponent;
  /** Full width. */
  block?: boolean;
  /** On an accent card (the ISBN/DOI card): a `small` button gets the light ground and no frame. */
  onAccent?: boolean;
  /** Spins in place of the label and takes no presses. */
  busy?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const inactive = busy || disabled;
  const ink = (
    {
      primary: 'accentFg',
      danger: 'accentFg',
      secondary: tone ?? 'fg',
      small: 'accent',
      text: tone ?? 'accent',
    } satisfies Record<ButtonVariant, keyof Colors>
  )[variant];
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={inactive || undefined}
      aria-busy={busy || undefined}
      disabled={inactive}
      onPress={onPress}
      className={cx(
        'flex-row items-center justify-center gap-2 rounded-control active:opacity-80',
        block ? 'self-stretch' : 'self-start',
        onAccent ? onAccentLook : looks[variant],
        variant === 'secondary' && frames[tone ?? 'none'],
        disabled && 'opacity-45',
      )}
    >
      {busy ? (
        <ActivityIndicator color={colors[ink]} />
      ) : (
        <>
          {Icon && <Icon color={colors[ink]} size={variant === 'small' ? 16 : 18} strokeWidth={1.6} />}
          <Text variant={variant === 'small' ? 'button' : 'action'} color={ink}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// Each look names its own height, padding and frame, so no two classes on a button set the same property.
const looks = {
  primary: 'min-h-11 bg-accent px-6 py-3',
  danger: 'min-h-11 bg-danger px-6 py-3',
  secondary: 'min-h-11 border px-6 py-3',
  small: 'min-h-9 border border-line px-3 py-2',
  text: 'min-h-11 px-1 py-0',
} as const satisfies Record<ButtonVariant, string>;

/** A `small` button on the accent card: the light ground, its frame gone. */
const onAccentLook = 'min-h-9 border border-transparent bg-accent-fg px-3 py-2';

/** A `secondary` button's frame: its tone, or the theme's line. */
const frames = { accent: 'border-accent', danger: 'border-danger', none: 'border-line' } as const;
