import type { SourceType } from '@homelibra/core/source';
import { Sheet } from '@homelibra/ui/sheet';
import { TextField } from '@homelibra/ui/text-field';
import { Text } from '@homelibra/ui/text';
import { cx, useTheme } from '@homelibra/ui/theme';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native';

import { SourceTypeIcon } from '@/features/source/source-type-icon';
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

/**
 * The same choice in place, on a wide screen, where there is no sheet
 * (ADR-0012): the filter, then the Sources under it in a box of its own
 * height, scrolling inside it. Mounted afresh, the filter starts empty.
 */
export function SourceChoice({ currentId, onPick }: { currentId: string; onPick: (source: PickedSource) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sources, shown, filter, setFilter } = useSourceMatches();
  return (
    <View className="gap-sm rounded-control border border-line bg-page p-sm">
      <TextField
        label={t('deletion.filterSources')}
        labelHidden
        placeholder={t('deletion.filterSources')}
        value={filter}
        onChangeText={setFilter}
        autoCorrect={false}
        autoFocus
      />
      {sources.isPending ? (
        <ActivityIndicator color={colors.accent} className="py-lg" />
      ) : sources.isError ? (
        <Text variant="body" className="py-lg text-center">
          {t('deletion.sourcesFailed')}
        </Text>
      ) : shown.length === 0 ? (
        <Text variant="body" className="py-lg text-center">
          {t('deletion.noSourceMatches')}
        </Text>
      ) : (
        <ScrollView className="max-h-[280px]" keyboardShouldPersistTaps="handled">
          {shown.map((source, index) => (
            <SourceRow
              key={source.id}
              source={source}
              current={source.id === currentId}
              first={index === 0}
              onPick={onPick}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

/** The Library's Sources by Başlık, narrowed to those whose Başlık or Yazar holds the filter. */
function useSourceMatches() {
  const trpc = useTRPC();
  const sources = useQuery(trpc.sources.list.queryOptions({ sort: 'title' }));
  const [filter, setFilter] = useState('');
  const needle = filter.trim().toLocaleLowerCase('tr');
  const shown = (sources.data ?? []).filter(
    (s) => !needle || `${s.title} ${s.author ?? ''}`.toLocaleLowerCase('tr').includes(needle),
  );
  return { sources, shown, filter, setFilter };
}

function SourceList({ currentId, onPick }: { currentId: string; onPick: (source: PickedSource) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { sources, shown, filter, setFilter } = useSourceMatches();

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
        <ActivityIndicator color={colors.accent} className="py-xl" />
      ) : sources.isError ? (
        <Text variant="body" className="py-xl text-center">
          {t('deletion.sourcesFailed')}
        </Text>
      ) : (
        <FlatList
          className="flex-1"
          data={shown}
          keyExtractor={(source) => source.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text variant="body" className="py-xl text-center">
              {t('deletion.noSourceMatches')}
            </Text>
          }
          renderItem={({ item: source, index }) => (
            <SourceRow source={source} current={source.id === currentId} first={index === 0} onPick={onPick} />
          )}
        />
      )}
    </>
  );
}

/** A Source to choose: its type, its Başlık, and its Yazar, "şu anki" after it for the Note's own. */
function SourceRow({
  source,
  current,
  first,
  onPick,
}: {
  source: PickedSource & { author?: string | null };
  current: boolean;
  first: boolean;
  onPick: (source: PickedSource) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const byline = [source.author, current && t('deletion.current')].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={current}
      onPress={() => onPick(source)}
      className={cx('flex-row items-center gap-3 py-3 active:opacity-70', !first && 'border-t border-line-soft')}
    >
      <SourceTypeIcon type={source.type} color={current ? colors.accent : colors.ink2} />
      <View className="flex-1 gap-0.75">
        <Text variant="sourceTitleSm" color={current ? 'accent' : 'fg'} numberOfLines={2}>
          {source.title}
        </Text>
        {byline !== '' && (
          <Text variant="caption" numberOfLines={1}>
            {byline}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
