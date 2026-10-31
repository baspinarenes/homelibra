import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Colors, fonts } from './tokens';
import { useThemedStyles } from './use-theme';

/**
 * Two or more views of one list as words over a thin rule (Okunuyor | Bitti,
 * Dosyalar | Etiketler): the open one in `fg` on a 2px `accent` underline,
 * each with its count in mono beside it. `right` sits at the row's far end.
 */
export function TextTabs<T extends string>({
  label,
  options,
  value,
  onChange,
  right,
}: {
  /** What screen readers call the tab list. */
  label: string;
  /** A count left out is not shown. */
  options: readonly { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  right?: ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row}>
      <View role="tablist" aria-label={label} style={styles.tabs}>
        {options.map((option) => {
          const selected = option.value === value;
          const counted = option.count !== undefined;
          return (
            <Pressable
              key={option.value}
              role="tab"
              aria-selected={selected}
              aria-label={counted ? `${option.label} ${option.count}` : option.label}
              onPress={() => onChange(option.value)}
              style={[styles.tab, selected && styles.selected]}
            >
              <Text style={[styles.text, selected && styles.selectedText]}>{option.label}</Text>
              {counted && <Text style={[styles.count, selected && styles.selectedCount]}>{option.count}</Text>}
            </Pressable>
          );
        })}
      </View>
      {right}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    tabs: { flexDirection: 'row', gap: 24 },
    // The underline sits on the row's rule.
    tab: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      paddingTop: 12,
      paddingBottom: 11,
      marginBottom: -1,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    selected: { borderBottomColor: c.accent },
    text: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 20, color: c.muted },
    selectedText: { color: c.fg },
    count: { fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 16, color: c.muted },
    selectedCount: { color: c.ink2 },
  });
