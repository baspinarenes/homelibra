import X from 'lucide-react-native/icons/x';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TagPicker } from '@/components/tag-picker';
import { type Colors, radius, type as typeScale, useTheme, useThemedStyles } from '@/theme';

/**
 * A Collection's definition as chips in its top bar: × takes a Tag out,
 * "+ etiket" opens the Tag picker on them. `onChange` gets the names the
 * definition should be left with.
 */
export function DefinitionTags({ names, onChange }: { names: string[]; onChange: (names: string[]) => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [picking, setPicking] = useState(false);
  return (
    <View style={styles.row}>
      {names.map((name) => (
        <View key={name} style={styles.chip}>
          <Text style={styles.chipText}>{name}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('collection.removeTag', { name })}
            onPress={() => onChange(names.filter((other) => other !== name))}
            hitSlop={6}
            style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
          >
            <X color={colors.chipInk} size={13} strokeWidth={2} />
          </Pressable>
        </View>
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
        title={t('collection.tagsTitle')}
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingLeft: 9,
      paddingRight: 5,
      borderRadius: radius.chip,
      backgroundColor: c.chipBg,
    },
    chipText: { ...typeScale.label, fontSize: 13, color: c.chipInk },
    remove: { padding: 2, borderRadius: radius.chip },
    add: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: c.line,
      borderStyle: 'dashed',
      borderRadius: radius.chip,
    },
    addText: { ...typeScale.label, fontSize: 13, color: c.accent },
    pressed: { opacity: 0.7 },
  });
