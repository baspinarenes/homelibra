import type { AppRouter } from '@homelibra/api';
import { type SourceType, sourceTypes } from '@homelibra/core/source';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { SourceTypeIcon } from '@/components/source-type-icon';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

export type PickableSource = inferRouterOutputs<AppRouter>['sources']['byLastNote'][number];

/**
 * Capture's Source list, a sheet over the flow: Sources by their latest
 * Note, and a quick add with only Tür and Başlık so reading is not broken
 * off; the rest is filled in on the Source form later. Okunuyor / Bitti
 * sections arrive with Reading status (P1).
 */
export function SourcePicker({
  visible,
  sources,
  currentId,
  onPick,
  onClose,
}: {
  visible: boolean;
  sources: readonly PickableSource[];
  currentId: string;
  onPick: (id: string) => void;
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
          accessibilityLabel={t('sourcePicker.close')}
          style={styles.dismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.header}>
            <Text style={styles.heading}>{t('sourcePicker.title')}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{t('sourcePicker.close')}</Text>
            </Pressable>
          </View>
          <FlatList
            style={styles.list}
            data={sources}
            keyExtractor={(source) => source.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item: source, index }) => {
              const current = source.id === currentId;
              return (
                <Pressable
                  accessibilityRole="button"
                  aria-selected={current}
                  onPress={() => onPick(source.id)}
                  style={({ pressed }) => [
                    styles.row,
                    index > 0 && styles.divided,
                    current && styles.current,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.type}>
                    {t(`sourceTypes.${source.type}.label`).toLocaleUpperCase('tr')}
                    {current && ` · ${t('sourcePicker.current').toLocaleUpperCase('tr')}`}
                  </Text>
                  <Text style={styles.title} numberOfLines={2}>
                    {source.title}
                  </Text>
                  {source.author && (
                    <Text style={styles.author} numberOfLines={1}>
                      {source.author}
                    </Text>
                  )}
                </Pressable>
              );
            }}
          />
          <QuickAdd onAdded={onPick} />
        </View>
      </View>
    </Modal>
  );
}

function QuickAdd({ onAdded }: { onAdded: (id: string) => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [type, setType] = useState<SourceType>('book');
  const [title, setTitle] = useState('');
  const create = useMutation(
    trpc.sources.create.mutationOptions({
      onSuccess: async ({ id }) => {
        await queryClient.invalidateQueries({ queryKey: trpc.sources.pathKey() });
        setTitle('');
        onAdded(id);
      },
    }),
  );
  const canAdd = title.trim() !== '' && !create.isPending;

  return (
    <View style={styles.quickAdd}>
      <Text style={styles.label}>{t('sourcePicker.quickAdd').toLocaleUpperCase('tr')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="radiogroup"
        accessibilityLabel={t('sourceForm.type')}
        contentContainerStyle={styles.types}
        keyboardShouldPersistTaps="handled"
      >
        {sourceTypes.map((option) => {
          const selected = option === type;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              aria-checked={selected}
              onPress={() => setType(option)}
              style={[styles.typeChip, selected && styles.typeChipSelected]}
            >
              <SourceTypeIcon type={option} color={selected ? colors.accent : colors.ink2} />
              <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                {t(`sourceTypes.${option}.label`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <TextInput
        accessibilityLabel={t('sourceForm.title')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('sourcePicker.titlePlaceholder')}
        placeholderTextColor={colors.muted2}
        onSubmitEditing={() => canAdd && create.mutate({ type, title })}
        style={styles.input}
      />
      {create.isError && <Text style={styles.error}>{t('sourcePicker.addFailed')}</Text>}
      <PrimaryButton
        label={t('sourcePicker.add')}
        onPress={() => create.mutate({ type, title })}
        busy={create.isPending}
        disabled={!canAdd}
      />
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
    list: { flexGrow: 0, paddingHorizontal: space.lg },
    row: { gap: 2, paddingVertical: space.md, paddingHorizontal: space.sm },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    current: { backgroundColor: c.accentSub, borderRadius: radius.chip },
    pressed: { opacity: 0.7 },
    type: { ...typeScale.micro, color: c.muted },
    title: { ...typeScale.sourceTitleSm, color: c.fg },
    author: { ...typeScale.caption, color: c.muted },
    quickAdd: {
      gap: space.sm,
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
    label: { ...typeScale.micro, color: c.muted },
    types: { gap: 6 },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.chip,
      backgroundColor: c.surface,
    },
    typeChipSelected: { borderColor: c.accent, backgroundColor: c.accentSub },
    typeLabel: { ...typeScale.label, color: c.fg },
    typeLabelSelected: { color: c.accent },
    input: {
      ...typeScale.body,
      fontFamily: typeScale.sourceTitleSm.fontFamily,
      fontSize: 17,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    error: { ...typeScale.caption, color: c.danger },
  });
