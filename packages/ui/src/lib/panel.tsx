import X from 'lucide-react-native/icons/x';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { cx } from './cx';
import { Text } from './text';
import { useTheme } from './use-theme';

/**
 * A wide screen's list and, once something in it is opened, the panel
 * beside it (ADR-0012): never over it, no drawer or sheet. With no panel
 * the list is centred in a 760 px reading column; with one, the list keeps
 * a 440 px column (420 beside the icon rail, `narrow`) and the panel takes
 * the rest. The list stays where it is in the tree in both states, so
 * opening the panel never remounts it or loses its scroll.
 */
export function PanelLayout({
  panel,
  narrow = false,
  children,
}: {
  panel?: ReactNode;
  narrow?: boolean;
  children: ReactNode;
}) {
  const open = !!panel;
  return (
    <View className={open ? 'flex-1 flex-row bg-page' : 'flex-1 flex-row justify-center bg-page px-xxl'}>
      <View
        className={
          open ? cx('min-w-0 border-r border-line', narrow ? 'w-[420px]' : 'w-[440px]') : 'w-full max-w-[760px] min-w-0'
        }
      >
        {children}
      </View>
      {panel}
    </View>
  );
}

/**
 * The panel itself, on the surface's ground: `head` along its top (what it
 * shows), `actions` after it, then the ✕ that closes it; under them its
 * content, scrolling on its own, and a form's `foot` (Vazgeç, Kaydet ⌘↵)
 * under that, on a rule, always in sight. Screen readers find it as a
 * region named `label`.
 */
export function Panel({
  label,
  head,
  actions,
  onClose,
  closeLabel,
  foot,
  children,
}: {
  label: string;
  head: ReactNode;
  actions?: ReactNode;
  foot?: ReactNode;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View role="region" aria-label={label} className="min-w-0 flex-1 bg-surface">
      <View className="flex-row items-center gap-md border-b border-line px-xl py-2.5">
        <View className="min-w-0 flex-1">{head}</View>
        <View className="flex-row items-center gap-xs">
          {actions}
          <Pressable
            role="button"
            aria-label={closeLabel}
            onPress={onClose}
            hitSlop={6}
            className="rounded-control p-1.5 active:opacity-70"
          >
            <X color={colors.ink2} size={18} strokeWidth={1.6} />
          </Pressable>
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="pb-xxl">
        {children}
      </ScrollView>
      {foot && <View className="border-t border-line px-xl py-md">{foot}</View>}
    </View>
  );
}

/** A key as the keyboard shows it, in a small frame: ⌘C, E, Esc. */
export function Key({ keys, tone = 'muted' }: { keys: string; tone?: 'muted' | 'onAccent' }) {
  return tone === 'onAccent' ? (
    <Text variant="count" color="accentFg" className="opacity-80">
      {keys}
    </Text>
  ) : (
    <View className="rounded-chip border border-line bg-surface px-1.25">
      <Text variant="count" color="ink2">
        {keys}
      </Text>
    </View>
  );
}

/** The keys a list answers to and what each does, along its foot. */
export function KeyHints({ hints }: { hints: readonly { keys: string; label: string }[] }) {
  return (
    <View className="flex-row flex-wrap items-center gap-md border-t border-line px-5 py-2">
      {hints.map((hint) => (
        <View key={hint.keys} className="flex-row items-center gap-1">
          <Key keys={hint.keys} />
          <Text variant="caption">{` ${hint.label}`}</Text>
        </View>
      ))}
    </View>
  );
}
