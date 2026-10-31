import { Chip, ChipRow } from '@homelibra/ui/chip';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TagPicker } from '@/components/tag-picker';

/**
 * A Collection's definition as chips in its top bar: × takes a Tag out,
 * "+ etiket" opens the Tag picker on them. `onChange` gets the names the
 * definition should be left with.
 */
export function DefinitionTags({ names, onChange }: { names: string[]; onChange: (names: string[]) => void }) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  return (
    <ChipRow>
      {names.map((name) => (
        <Chip
          key={name}
          label={name}
          onRemove={() => onChange(names.filter((other) => other !== name))}
          removeLabel={t('collection.removeTag', { name })}
        />
      ))}
      <Chip label={t('tags.add')} tone="add" onPress={() => setPicking(true)} />
      <TagPicker
        visible={picking}
        title={t('collection.tagsTitle')}
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
