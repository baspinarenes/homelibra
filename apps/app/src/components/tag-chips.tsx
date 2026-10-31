import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TagPicker } from '@/components/tag-picker';
import { type Colors, radius, type as typeScale, useThemedStyles } from '@/theme';

/**
 * A Note's or a Source's Tags as chips, then "+ etiket", which opens the Tag
 * picker on them; the picker's Tamam hands the names to `onChange`.
 */
export function TagChips({
  names,
  pickerTitle,
  onChange,
}: {
  names: string[];
  /** The picker's heading: whose Tags these are. */
  pickerTitle: string;
  onChange: (names: string[]) => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const [picking, setPicking] = useState(false);
  return (
    <View style={styles.row}>
      {names.map((name) => (
        <Pressable
          key={name}
          accessibilityRole="button"
          onPress={() => setPicking(true)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
        >
          <Text style={styles.chipText}>{name}</Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => setPicking(true)}
        hitSlop={6}
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}
      >
        <Text style={styles.addText}>{t('tags.add')}</Text>
      </Pressable>
      <TagPicker
        visible={picking}
        title={pickerTitle}
        value={names}
        onDone={(next) => {
          setPicking(false);
          onChange(next);
        }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

/** A Note's own Tags in a line, or "etiketsiz": never its Source's (ADR-0003). */
export function NoteTagsLine({ names }: { names: string[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return names.length > 0 ? (
    <Text style={styles.line}>{names.join(' · ')}</Text>
  ) : (
    <Text style={styles.untagged}>{t('tags.untagged')}</Text>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
    chip: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: radius.chip, backgroundColor: c.chipBg },
    chipText: { ...typeScale.label, fontSize: 13, color: c.chipInk },
    add: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: c.line,
      borderStyle: 'dashed',
      borderRadius: radius.chip,
    },
    addText: { ...typeScale.label, fontSize: 13, color: c.accent },
    line: { ...typeScale.caption, color: c.chipInk },
    untagged: { ...typeScale.caption, color: c.muted2 },
    pressed: { opacity: 0.7 },
  });
