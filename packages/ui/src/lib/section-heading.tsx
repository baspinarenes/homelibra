import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import type { IconComponent } from './icon';
import { Text } from './text';
import { useTheme } from './use-theme';

type HeadingProps = {
  title: string;
  /** Mono, at the right: "2 sa önce", "14". */
  count?: string;
  /** A word that goes on, at the right: "Tümü ›". */
  link?: { label: string; onPress: () => void };
  /** Something done here, at the right: an icon before its word. */
  action?: { label: string; accessibilityLabel: string; icon: IconComponent; onPress: () => void };
};

/** A section's heading: one style and colour everywhere in the app, whatever the section. */
export function SectionHeading({ title, count, link, action }: HeadingProps) {
  const { colors } = useTheme();
  return (
    // Baseline-aligned, the two ends apart.
    <View className="flex-row items-baseline justify-between gap-3">
      <Text variant="heading" className="shrink">
        {title}
      </Text>
      {count !== undefined && <Text variant="collectionCount">{count}</Text>}
      {link && (
        <Pressable role="link" aria-label={link.label} onPress={link.onPress} hitSlop={12}>
          <Text variant="link">{link.label}</Text>
        </Pressable>
      )}
      {action && (
        <Pressable
          role="button"
          aria-label={action.accessibilityLabel}
          onPress={action.onPress}
          hitSlop={12}
          // Centred: an icon has no baseline to line up.
          className="flex-row items-center gap-1.25 self-center"
        >
          <action.icon color={colors.accent} size={15} strokeWidth={2} />
          <Text variant="link">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

/**
 * A section without a box: its heading, then its content, 18 above and below.
 * Between its parts, 12 by default; `text` sets running text 8 apart (İletişim);
 * `rows` puts `SettingsRow`s 6 under the heading and close to each other, as
 * the Ayarlar boards draw Hesap and Gizlilik.
 */
export function Section({
  children,
  spacing = 'default',
  ...heading
}: HeadingProps & { spacing?: 'default' | 'text' | 'rows'; children: ReactNode }) {
  return (
    <View className={sectionLooks[spacing]}>
      <View className={spacing === 'rows' ? 'mb-1.5' : undefined}>
        <SectionHeading {...heading} />
      </View>
      {children}
    </View>
  );
}

// Each spacing names its own gap: two gap classes on one element fight on the web.
const sectionLooks = {
  default: 'gap-3 py-4.5',
  text: 'gap-2 py-4.5',
  rows: 'gap-0 py-4.5',
} as const;

/** Running text inside a section. */
export function SectionText({ children }: { children: ReactNode }) {
  return <Text variant="body">{children}</Text>;
}

/** Sections one under another, a thin `lineSoft` rule between each two. */
export function Sections({ children }: { children: ReactNode }) {
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
