import type { SourceType } from '@homelibra/core/source';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SourceTypeIcon } from '@/components/source-type-icon';
import { useTRPC } from '@/lib/trpc';
import { type Colors, radius, space, type as typeScale, useTheme, useThemedStyles } from '@/theme';

export type PickedSource = { id: string; type: SourceType; title: string };

/**
 * Note editing's Kaynak field opens this sheet: the Library's Sources by
 * Başlık, found by a part of the Başlık or Yazar, the Note's own Source
 * marked. Choosing one moves the Note there when the edit is saved (#36).
 */
export function SourcePicker({
  visible,
  currentId,
  onPick,
  onClose,
}: {
  visible: boolean;
  currentId: string;
  onPick: (source: PickedSource) => void;
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
          accessibilityLabel={t('deletion.close')}
          style={styles.dismiss}
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.header}>
            <Text style={styles.heading}>{t('deletion.chooseSource')}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{t('deletion.close')}</Text>
            </Pressable>
          </View>
          {/* Mounted afresh each time, so the filter starts empty. */}
          {visible && <SourceList currentId={currentId} onPick={onPick} />}
        </View>
      </View>
    </Modal>
  );
}

function SourceList({ currentId, onPick }: { currentId: string; onPick: (source: PickedSource) => void }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const trpc = useTRPC();
  const sources = useQuery(trpc.sources.list.queryOptions({ sort: 'title' }));
  const [filter, setFilter] = useState('');
  const needle = filter.trim().toLocaleLowerCase('tr');
  const shown = (sources.data ?? []).filter(
    (s) => !needle || `${s.title} ${s.author ?? ''}`.toLocaleLowerCase('tr').includes(needle),
  );

  return (
    <View style={styles.body}>
      <TextInput
        accessibilityLabel={t('deletion.filterSources')}
        placeholder={t('deletion.filterSources')}
        placeholderTextColor={colors.muted2}
        value={filter}
        onChangeText={setFilter}
        autoCorrect={false}
        style={styles.filter}
      />
      {sources.isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.status} />
      ) : sources.isError ? (
        <Text style={[styles.lead, styles.status]}>{t('deletion.sourcesFailed')}</Text>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(source) => source.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={[styles.lead, styles.status]}>{t('deletion.noSourceMatches')}</Text>}
          renderItem={({ item: source, index }) => {
            const current = source.id === currentId;
            return (
              <Pressable
                accessibilityRole="button"
                aria-selected={current}
                onPress={() => onPick(source)}
                style={({ pressed }) => [styles.row, index > 0 && styles.divided, pressed && styles.pressed]}
              >
                <SourceTypeIcon type={source.type} color={current ? colors.accent : colors.ink2} />
                <View style={styles.text}>
                  <Text style={[styles.title, current && styles.currentTitle]} numberOfLines={2}>
                    {source.title}
                  </Text>
                  {source.author && (
                    <Text style={styles.byline} numberOfLines={1}>
                      {source.author}
                    </Text>
                  )}
                </View>
                {current && <Text style={styles.current}>{t('deletion.current')}</Text>}
              </Pressable>
            );
          }}
        />
      )}
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
      maxHeight: '80%',
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
    body: { flexShrink: 1, gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm },
    filter: {
      ...typeScale.body,
      color: c.fg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: radius.input,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    status: { paddingVertical: space.xl },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    pressed: { opacity: 0.7 },
    text: { flex: 1, gap: 2 },
    title: { ...typeScale.sourceTitleSm, color: c.fg },
    currentTitle: { color: c.accent },
    byline: { ...typeScale.caption, color: c.muted },
    current: { ...typeScale.caption, color: c.accent },
  });
