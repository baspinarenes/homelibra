import X from 'lucide-react-native/icons/x';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, radius, type as typeScale } from './tokens';
import { useTheme, useThemedStyles } from './use-theme';

export type ChipTone = 'tag' | 'add' | 'warn' | 'done' | 'outline';

/**
 * A small label: a Tag, a choice that toggles, an add button (+ etiket) or a
 * status (4 etiketsiz, bitti, okunuyor). Chosen chips are on `accent`, as a
 * Segment's chosen option is.
 */
export function Chip({
  label,
  tone = 'tag',
  selected,
  removable = false,
  onPress,
  onRemove,
  removeLabel,
}: {
  label: string;
  tone?: ChipTone;
  /** Set for a chip that toggles: whether it is chosen. */
  selected?: boolean;
  /** A chosen Tag that a press takes off: shows × after the label. */
  removable?: boolean;
  /** Makes the chip a button. Without it the chip only shows. */
  onPress?: () => void;
  /** An × of its own after the label, that takes the Tag out (a Collection's definition). */
  onRemove?: () => void;
  /** What screen readers call the ×. */
  removeLabel?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const look = [styles.chip, styles[tone], selected && styles.selected];
  const ink = [styles.label, styles[`${tone}Ink`], selected && styles.selectedInk];
  const shown = removable ? `${label} ×` : label;
  if (onRemove) {
    return (
      <View style={[...look, styles.withRemove]}>
        <Text style={ink}>{label}</Text>
        <Pressable
          role="button"
          aria-label={removeLabel ?? label}
          onPress={onRemove}
          hitSlop={6}
          style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
        >
          <X color={colors.chipInk} size={13} strokeWidth={2} />
        </Pressable>
      </View>
    );
  }
  if (!onPress) {
    return (
      <View style={look}>
        <Text style={ink}>{shown}</Text>
      </View>
    );
  }
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-pressed={selected}
      onPress={onPress}
      style={({ pressed }) => [...look, pressed && styles.pressed]}
    >
      <Text style={ink}>{shown}</Text>
    </Pressable>
  );
}

/** Chips side by side, wrapping onto the next line. */
export function ChipRow({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.row}>{children}</View>;
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingVertical: 3,
      paddingHorizontal: 9,
      borderRadius: radius.chip,
    },
    label: { ...typeScale.labelSm },
    tag: { backgroundColor: c.chipBg },
    tagInk: { color: c.chipInk },
    add: { borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, paddingVertical: 2, paddingHorizontal: 8 },
    addInk: { color: c.accent },
    warn: { backgroundColor: c.warnSoft },
    warnInk: { color: c.warn },
    done: { backgroundColor: c.accentSoft },
    doneInk: { color: c.accent },
    outline: { borderWidth: 1, borderColor: c.line, paddingVertical: 2, paddingHorizontal: 8 },
    outlineInk: { color: c.ink2 },
    selected: { backgroundColor: c.accent, borderWidth: 0, paddingVertical: 3, paddingHorizontal: 9 },
    selectedInk: { color: c.accentFg },
    pressed: { opacity: 0.8 },
    withRemove: { gap: 4, paddingRight: 5 },
    remove: { padding: 2, borderRadius: radius.chip },
  });
