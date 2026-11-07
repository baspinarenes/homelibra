import { Chip, ChipRow } from '@homelibra/ui/chip';
import { Text } from '@homelibra/ui/text';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TagPicker } from '@/components/tag-picker';

/**
 * A Note's or a Source's Tags as chips, then "+ etiket", which opens the Tag
 * picker on them; closing the picker hands changed names to `onChange`.
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
        onChange={onChange}
        onClose={() => setPicking(false)}
      />
    </ChipRow>
  );
}

/** A Note's own Tags in a line, or "etiketsiz": never its Source's (ADR-0003). */
export function NoteTagsLine({ names }: { names: string[] }) {
  const { t } = useTranslation();
  return names.length > 0 ? (
    <Text variant="caption" color="chipInk">
      {names.join(' · ')}
    </Text>
  ) : (
    <Text variant="caption" color="muted2">
      {t('tags.untagged')}
    </Text>
  );
}
