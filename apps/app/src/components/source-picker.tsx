import type { SourceType } from '@homelibra/core/source';
import { Sheet } from '@homelibra/ui/sheet';
import { TextField } from '@homelibra/ui/text-field';
import { type Colors, space, type as typeScale, useTheme, useThemedStyles } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { SourceTypeIcon } from '@/components/source-type-icon';
import { useTRPC } from '@/lib/trpc';

export type PickedSource = { id: string; type: SourceType; title: string };

/**
 * Note editing's Kaynak field opens this sheet: the Library's Sources by
 * Başlık, found by a part of the Başlık or Yazar, the Note's own Source
 * marked. Choosing one moves the Note there when the edit is saved (#36).
 * The sheet stands at its full height; the list scrolls under the field.
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
  return (
    <Sheet visible={visible} fill title={t('deletion.chooseSource')} closeLabel={t('deletion.close')} onClose={onClose}>
      {/* Mounted afresh each time, so the filter starts empty. */}
      {visible && <SourceList currentId={currentId} onPick={onPick} />}
    </Sheet>
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
    <>
      <TextField
        label={t('deletion.filterSources')}
        labelHidden
        placeholder={t('deletion.filterSources')}
        value={filter}
        onChangeText={setFilter}
        autoCorrect={false}
      />
      {sources.isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.status} />
      ) : sources.isError ? (
        <Text style={[styles.lead, styles.status]}>{t('deletion.sourcesFailed')}</Text>
      ) : (
        <FlatList
          style={styles.list}
          data={shown}
          keyExtractor={(source) => source.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={[styles.lead, styles.status]}>{t('deletion.noSourceMatches')}</Text>}
          renderItem={({ item: source, index }) => {
            const current = source.id === currentId;
            const byline = [source.author, current && t('deletion.current')].filter(Boolean).join(' · ');
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
                  {byline !== '' && (
                    <Text style={styles.byline} numberOfLines={1}>
                      {byline}
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    list: { flex: 1 },
    status: { paddingVertical: space.xl },
    lead: { ...typeScale.body, color: c.ink2, textAlign: 'center' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    divided: { borderTopWidth: 1, borderTopColor: c.lineSoft },
    pressed: { opacity: 0.7 },
    text: { flex: 1, gap: 3 },
    title: { ...typeScale.sourceTitleSm, color: c.fg },
    currentTitle: { color: c.accent },
    byline: { ...typeScale.caption, color: c.muted },
  });
