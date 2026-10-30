import { tagIdentity, tagName, tagSuggestKey } from '@homelibra/core/tag';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

/** Suggestions shown at once, from the most used down. */
const suggestionCount = 12;

/**
 * The Tag picker (#3, story 75): the chosen Tags, suggestions from the most
 * used, a search that ignores circumflexes, ı/i, case and punctuation
 * ("hilafet" finds "Hilâfet"), and a new Tag spelled as typed. A sheet over
 * the screen; Tamam hands back the names, Kapat leaves them as they were.
 */
export function TagPicker({
  visible,
  title,
  value,
  onDone,
  onClose,
}: {
  visible: boolean;
  title: string;
  value: string[];
  onDone: (names: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tags.close')}
          style={styles.dismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.header}>
            <Text style={styles.heading}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{t('tags.close')}</Text>
            </Pressable>
          </View>
          {/* Mounted afresh each time, so it starts from the Tags in use. */}
          {visible && <TagEditor initial={value} onDone={onDone} />}
        </View>
      </View>
    </Modal>
  );
}

function TagEditor({ initial, onDone }: { initial: string[]; onDone: (names: string[]) => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const known = useQuery(trpc.tags.list.queryOptions({ sort: 'usage' }));
  const [chosen, setChosen] = useState(initial);
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
    if (!chosenIds.has(identity)) setChosen([...chosen, byIdentity.get(identity) ?? clean]);
    setQuery('');
  };
  const remove = (name: string) => setChosen(chosen.filter((chosenName) => chosenName !== name));

  return (
    <View style={styles.body}>
      <View style={styles.chips}>
        {chosen.length > 0 ? (
          chosen.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={t('tags.remove', { name })}
              onPress={() => remove(name)}
              style={({ pressed }) => [styles.chosen, pressed && styles.pressed]}
            >
              <Text style={styles.chosenText}>{`${name} ×`}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.hint}>{t('tags.none')}</Text>
        )}
      </View>
      <TextInput
        accessibilityLabel={t('tags.search')}
        autoFocus
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => add(query)}
        submitBehavior="submit"
        placeholder={t('tags.search')}
        placeholderTextColor={colors.muted2}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        style={styles.input}
      />
      <ScrollView style={styles.suggestions} keyboardShouldPersistTaps="handled">
        <View style={styles.chips}>
          {isNew && (
            <Pressable
              accessibilityRole="button"
              onPress={() => add(typed)}
              style={({ pressed }) => [styles.newChip, pressed && styles.pressed]}
            >
              <Text style={styles.newText}>{t('tags.newTag', { name: typed })}</Text>
            </Pressable>
          )}
          {suggestions.map((tag) => (
            <Pressable
              key={tag.id}
              accessibilityRole="button"
              onPress={() => add(tag.name)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipText}>{tag.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <PrimaryButton label={t('tags.done')} onPress={() => onDone(chosen)} />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim },
    dismiss: { ...StyleSheet.absoluteFill },
    sheet: {
      width: '100%',
      maxWidth: 560,
      maxHeight: '85%',
      alignSelf: 'center',
      backgroundColor: c.page,
      borderTopLeftRadius: radius.hero,
      borderTopRightRadius: radius.hero,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: space.lg,
      paddingTop: space.lg,
      paddingBottom: space.sm,
    },
    heading: { ...typeScale.sourceTitle, color: c.fg },
    close: { ...typeScale.button, color: c.accent },
    body: { flexShrink: 1, gap: space.md, paddingHorizontal: space.lg, paddingTop: space.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    hint: { ...typeScale.caption, color: c.muted },
    chosen: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: radius.chip,
      backgroundColor: c.accentSoft,
    },
    chosenText: { ...typeScale.label, color: c.accent },
    chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.chip, backgroundColor: c.chipBg },
    chipText: { ...typeScale.label, color: c.chipInk },
    newChip: {
      paddingVertical: 3,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: c.accent,
      borderStyle: 'dashed',
      borderRadius: radius.chip,
    },
    newText: { ...typeScale.label, color: c.accent },
    input: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.accent,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
      outlineWidth: 0,
    },
    suggestions: { flexGrow: 0, maxHeight: 220 },
    pressed: { opacity: 0.7 },
  });
