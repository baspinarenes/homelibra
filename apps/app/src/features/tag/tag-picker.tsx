import { tagIdentity, tagName, tagSuggestKey } from '@homelibra/core/tag';
import { Chip, ChipRow } from '@homelibra/ui/chip';
import { Sheet } from '@homelibra/ui/sheet';
import { Text } from '@homelibra/ui/text';
import { TextField } from '@homelibra/ui/text-field';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTRPC } from '@/lib/trpc';

/** Suggestions shown at once, from the most used down. */
const suggestionCount = 12;

/**
 * The Tag picker (#3, story 75): the chosen Tags, suggestions from the most
 * used, a search that ignores circumflexes, ı/i, case and punctuation
 * ("hilafet" finds "Hilâfet"), and a new Tag spelled as typed. A sheet over
 * the screen with no save button: what is chosen holds, and closing the sheet
 * (its X, a swipe, the backdrop, Android's back) hands the names to `onChange`
 * if they changed.
 * A name typed but never entered is not added.
 */
export function TagPicker({
  visible,
  title,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  title: string;
  value: string[];
  onChange: (names: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [chosen, setChosen] = useState(value);
  // Each opening starts from the Tags in use.
  const [open, setOpen] = useState(visible);
  if (open !== visible) {
    setOpen(visible);
    if (visible) setChosen(value);
  }

  const close = () => {
    // A Tag taken out and put back is no change, though it now stands last.
    const changed = chosen.length !== value.length || chosen.some((name) => !value.includes(name));
    if (changed) onChange(chosen);
    onClose();
  };

  return (
    <Sheet visible={visible} title={title} closeLabel={t('tags.close')} onClose={close}>
      {/* Mounted afresh each time, so the search starts empty. */}
      {visible && <TagEditor chosen={chosen} onChange={setChosen} />}
    </Sheet>
  );
}

function TagEditor({ chosen, onChange }: { chosen: string[]; onChange: (names: string[]) => void }) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const known = useQuery(trpc.tags.list.queryOptions({ sort: 'usage' }));
  const [query, setQuery] = useState('');

  const chosenIds = useMemo(() => new Set(chosen.map(tagIdentity)), [chosen]);
  // The Library's Tags by identity: a name typed again takes the Tag's own spelling.
  const byIdentity = useMemo(
    () => new Map((known.data ?? []).map((tag) => [tagIdentity(tag.name), tag.name])),
    [known.data],
  );

  const typed = tagName(query);
  const key = tagSuggestKey(typed);
  const suggestions = (known.data ?? [])
    .filter((tag) => !chosenIds.has(tagIdentity(tag.name)) && tagSuggestKey(tag.name).includes(key))
    .slice(0, suggestionCount);
  // A new Tag unless the typed name is one already (by identity, not by the looser suggestion key).
  const isNew = typed !== '' && !byIdentity.has(tagIdentity(typed)) && !chosenIds.has(tagIdentity(typed));

  const add = (name: string) => {
    const clean = tagName(name);
    if (!clean) return;
    const identity = tagIdentity(clean);
    if (!chosenIds.has(identity)) onChange([...chosen, byIdentity.get(identity) ?? clean]);
    setQuery('');
  };
  const remove = (name: string) => onChange(chosen.filter((chosenName) => chosenName !== name));

  return (
    <>
      {chosen.length > 0 ? (
        <ChipRow>
          {chosen.map((name) => (
            <Chip key={name} label={name} selected removable onPress={() => remove(name)} />
          ))}
        </ChipRow>
      ) : (
        <Text variant="caption">{t('tags.none')}</Text>
      )}
      <TextField
        label={t('tags.search')}
        labelHidden
        autoFocus
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => add(query)}
        submitBehavior="submit"
        placeholder={t('tags.search')}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />
      {(isNew || suggestions.length > 0) && (
        <ChipRow>
          {isNew && <Chip label={t('tags.newTag', { name: typed })} tone="add" onPress={() => add(typed)} />}
          {suggestions.map((tag) => (
            <Chip key={tag.id} label={tag.name} onPress={() => add(tag.name)} />
          ))}
        </ChipRow>
      )}
    </>
  );
}
