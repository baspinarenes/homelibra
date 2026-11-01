import { Children, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, type as typeScale } from './tokens';
import { useThemedStyles } from './use-theme';

type HeadingProps = {
  title: string;
  /** Mono, at the right: "2 sa önce", "14". */
  count?: string;
  /** A word that goes on, at the right: "Tümü ›". */
  link?: { label: string; onPress: () => void };
};

/** A section's heading: one style and colour everywhere in the app, whatever the section. */
export function SectionHeading({ title, count, link }: HeadingProps) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <Text role="heading" style={styles.title}>
        {title.toLocaleUpperCase('tr')}
      </Text>
      {count !== undefined && <Text style={styles.count}>{count}</Text>}
      {link && (
        <Pressable role="link" aria-label={link.label} onPress={link.onPress} hitSlop={12}>
          <Text style={styles.link}>{link.label}</Text>
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
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.section, spacing === 'text' && styles.text, spacing === 'rows' && styles.rows]}>
      <View style={spacing === 'rows' && styles.rowsHeading}>
        <SectionHeading {...heading} />
      </View>
      {children}
    </View>
  );
}

/** Running text inside a section. */
export function SectionText({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.body}>{children}</Text>;
}

/** Sections one under another, a thin `lineSoft` rule between each two. */
export function Sections({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View>
      {Children.toArray(children).map((child, index) => (
        <View key={index} style={index > 0 && styles.divider}>
          {child}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    // Baseline-aligned, the two ends apart.
    row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
    title: { ...typeScale.heading, color: c.muted, flexShrink: 1 },
    count: { ...typeScale.heading, letterSpacing: 0, color: c.muted },
    link: { ...typeScale.link, color: c.accent },
    section: { gap: 12, paddingVertical: 18 },
    text: { gap: 8 },
    rows: { gap: 0 },
    rowsHeading: { marginBottom: 6 },
    body: { ...typeScale.body, color: c.ink2 },
    divider: { borderTopWidth: 1, borderTopColor: c.lineSoft },
  });
