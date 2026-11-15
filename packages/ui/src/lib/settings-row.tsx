import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './use-theme';

/**
 * One line that opens something (`.srow` on the Ayarlar boards): a label, an
 * optional value on the right, a chevron; at least 48 high. `danger` is for
 * the row that leads to what cannot be taken back (Hesabı sil).
 */
export function SettingsRow({
  label,
  value,
  tone = 'fg',
  onPress,
}: {
  label: string;
  /** Muted, before the chevron: the address an E-posta adresi row opens. */
  value?: string;
  tone?: 'fg' | 'danger';
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      role="button"
      onPress={onPress}
      className="min-h-12 flex-row items-center gap-md py-sm active:opacity-60"
    >
      <Text variant="body" color={tone} className="shrink-0 grow">
        {label}
      </Text>
      {value ? (
        <Text variant="caption" className="shrink" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <ChevronRight size={18} color={colors.muted2} />
    </Pressable>
  );
}

/** `SettingsRow`s one under another, a thin `lineSoft` rule between each two. */
export function SettingsRows({ children }: { children: ReactNode }) {
  return (
    <View>
      {Children.toArray(children).map((child, index) => (
        <View key={index} className={index > 0 ? 'border-t border-line-soft' : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}
