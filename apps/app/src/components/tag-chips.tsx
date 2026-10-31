import { Chip, ChipRow } from '@homelibra/ui/chip';
import { type Colors, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { TagPicker } from '@/components/tag-picker';

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
  const [picking, setPicking] = useState(false);
  return (
    <ChipRow>
      {names.map((name) => (
        <Chip key={name} label={name} onPress={() => setPicking(true)} />
      ))}
      <Chip label={t('tags.add')} tone="add" onPress={() => setPicking(true)} />
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
    </ChipRow>
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
    line: { ...typeScale.caption, color: c.chipInk },
    untagged: { ...typeScale.caption, color: c.muted2 },
  });
