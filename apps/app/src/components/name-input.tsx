import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { type Colors, radius, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * A Collection's name being written: "+ Yeni dosya" and Adı değiştir. The
 * confirm button stays off while the name is blank.
 */
export function NameInput({
  initial = '',
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  initial?: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const [name, setName] = useState(initial);
  const ready = name.trim().length > 0 && !busy;
  const confirm = () => ready && onConfirm(name.trim());
  return (
    <View style={styles.form}>
      <TextInput
        accessibilityLabel={t('collection.nameLabel')}
        autoFocus
        value={name}
        onChangeText={setName}
        onSubmitEditing={confirm}
        placeholder={t('collection.namePlaceholder')}
        placeholderTextColor={styles.placeholder.color}
        returnKeyType="done"
        maxLength={200}
        style={styles.input}
      />
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={6}>
          <Text style={styles.cancel}>{t('collection.cancel')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={confirm}
          disabled={!ready}
          hitSlop={6}
          style={!ready && styles.inactive}
        >
          <Text style={styles.confirm}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    form: { gap: space.sm },
    input: {
      ...typeScale.sourceTitle,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
    },
    placeholder: { color: c.muted2 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.lg },
    cancel: { ...typeScale.button, color: c.muted },
    confirm: { ...typeScale.button, color: c.accent },
    inactive: { opacity: 0.4 },
  });
