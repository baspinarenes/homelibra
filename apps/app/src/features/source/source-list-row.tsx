import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { SourceCover } from '@/features/source/source-cover';
import { elapsed } from '@/features/library/elapsed';

type ListedSource = inferRouterOutputs<AppRouter>['sources']['list'][number];

/**
 * A Kaynaklar row (#40, story 165): Cover, type, Başlık, Yazar · Tarih, then
 * the Note count · when the last Note came ("notsuz" without one). It opens
 * the Source page.
 */
export function SourceListRow({ source, divided }: { source: ListedSource; divided: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  // Yazar · Tarih, the Date as it was entered.
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  const notes = source.lastNoteAt
    ? `${t('sourceList.notes', { count: source.noteCount })} · ${elapsed(t, source.lastNoteAt)}`
    : t('sourceList.noNotes');
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id } })}
      className={cx('flex-row items-center gap-3.25 py-md active:opacity-70', divided && 'border-t border-line-soft')}
    >
      <SourceCover type={source.type} cover={source.cover} />
      <View className="flex-1 gap-0.5">
        <Text variant="micro">{t(`sourceTypes.${source.type}.label`)}</Text>
        <Text variant="sourceTitleSm" numberOfLines={2}>
          {source.title}
        </Text>
        {byline !== '' && (
          <Text variant="caption" numberOfLines={1}>
            {byline}
          </Text>
        )}
        <Text variant="caption">{notes}</Text>
      </View>
    </Pressable>
  );
}
