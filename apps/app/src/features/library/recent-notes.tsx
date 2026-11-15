import { Section } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { elapsed } from '@/features/library/elapsed';
import { useTRPC } from '@/lib/trpc';

/**
 * A wide Genel Bakış's Son notlar (#182, Q42): the Library's last five
 * Notes, each its Locator, its Source on one line (Yazar, Başlık), when it
 * was captured, and its Alıntı, or its Yorum when it has none. A press opens
 * the Source page with that Note shown in its column. No "Tümü": the rest is
 * in Kaynaklar. Inside `<Sections wide>`; nothing while there are none.
 */
export function RecentNotes() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const router = useRouter();
  const recent = useQuery(trpc.notes.recent.queryOptions());
  if (!recent.data?.length) return null;

  return (
    <Section title={t('wideHome.recentNotes')} count={String(recent.data.length)}>
      <View className="pb-2.5">
        {recent.data.map((note) => (
          <Pressable
            key={note.id}
            role="button"
            onPress={() => router.push({ pathname: '/source/[id]', params: { id: note.sourceId, note: note.id } })}
            className="gap-xs border-b border-line-soft py-2.5 active:opacity-70"
          >
            <View className="flex-row items-baseline gap-sm">
              {note.locator && (
                <Text variant="locator" color="accent" className="max-w-[40%]" numberOfLines={1}>
                  {note.locator}
                </Text>
              )}
              <Text variant="caption" className="min-w-0 flex-1" numberOfLines={1}>
                {[note.source.author, note.source.title].filter(Boolean).join(', ')}
              </Text>
              <Text variant="count">{elapsed(t, note.capturedAt)}</Text>
            </View>
            {note.excerpt ? (
              <Text variant="excerptSm" className="border-l-2 border-quote-bar pl-md" numberOfLines={3}>
                {note.excerpt}
              </Text>
            ) : (
              <Text variant="commentSm" numberOfLines={3}>
                {note.comment}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </Section>
  );
}
