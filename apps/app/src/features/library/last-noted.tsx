import type { AppRouter } from '@homelibra/api';
import { formatDate } from '@homelibra/core/date';
import { Section, SectionHeading } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { cx } from '@homelibra/ui/theme';
import type { inferRouterOutputs } from '@trpc/server';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { elapsed } from '@/features/library/elapsed';
import { SourceCover } from '@/features/source/source-cover';
import { useLastNotedLayout } from '@/lib/appearance-choices';

export type LastNoted = NonNullable<inferRouterOutputs<AppRouter>['sources']['lastNoted']>;

/**
 * Kaldığın yer (#131): the last noted Source and that Note, unboxed, in the
 * layout Ayarlar picks: the Note on top with the Source under it (Not önde),
 * or the Source on top with the Note under it (Kaynak önde). Either way it
 * ends in "Yazmaya devam et ›" and the Locator, and all of it is one press
 * that opens the Source ready to write, the writing sheet up with the last
 * Locator carried over (#87, #157). `wide` (#182): a section of a wide
 * Genel Bakış's main column, inside `<Sections wide>`, its Alıntı large and
 * ruled in either layout (Q43).
 */
export function LastNotedSection({
  lastNoted: { source, note },
  afterAlerts = false,
  wide = false,
}: {
  lastNoted: LastNoted;
  afterAlerts?: boolean;
  wide?: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const layout = useLastNotedLayout();
  const byline = [source.author, source.date && formatDate(source.date)].filter(Boolean).join(' · ');
  const text = note.excerpt ?? note.comment;
  const noteFirst = layout === 'note';
  const large = wide || noteFirst;
  // Not önde: the words last written, large and dark, the Source a line under them.
  const noteText = text && (
    <Text
      variant={note.excerpt ? (large ? 'excerptLg' : 'excerpt') : large ? 'bodyLg' : 'body'}
      className={
        !note.excerpt
          ? undefined
          : wide
            ? 'border-l-2 border-quote-bar pl-4'
            : noteFirst
              ? undefined
              : 'border-l-2 border-quote-bar pl-2.75'
      }
      numberOfLines={large ? 4 : 3}
    >
      {text}
    </Text>
  );
  const bylineText = byline !== '' && (
    <Text variant="caption" numberOfLines={1}>
      {byline}
    </Text>
  );
  const when = elapsed(t, note.capturedAt);
  const press = (
    <Pressable
      role="button"
      onPress={() => router.push({ pathname: '/source/[id]', params: { id: source.id, write: '1' } })}
      className="gap-3.5 active:opacity-70"
    >
      {noteFirst ? (
        <>
          {noteText}
          <View className="flex-row items-center gap-md">
            <SourceCover type={source.type} cover={source.cover} />
            <View className="min-w-0 flex-1 gap-xs">
              <Text variant="sourceTitleSm" numberOfLines={1}>
                {source.title}
              </Text>
              {bylineText}
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Kaynak önde: the Source as the Source page heads it. */}
          <View className="flex-row gap-3.5">
            <SourceCover type={source.type} cover={source.cover} size="large" />
            <View className="min-w-0 flex-1 gap-xs">
              <Text variant="micro" color="accent">
                {t(`sourceTypes.${source.type}.label`)}
              </Text>
              {/* The Source Kaldığın yer points to, not a heading: KALDIĞIN YER is the section's. */}
              <Text variant="sourceTitle" role={undefined} numberOfLines={2}>
                {source.title}
              </Text>
              {bylineText}
            </View>
          </View>
          {noteText}
        </>
      )}
      <View className="flex-row items-baseline justify-between gap-md">
        <Text variant="button">{t('home.goOn')}</Text>
        {note.locator && (
          <Text variant="locator" className="shrink" numberOfLines={1}>
            {note.locator}
          </Text>
        )}
      </View>
    </Pressable>
  );

  if (wide)
    return (
      <Section title={t('home.lastNoted')} count={when}>
        <WideSectionBody>{press}</WideSectionBody>
      </Section>
    );
  return (
    // 18 under the header's rule, as every Section stands; 14 under the alerts.
    <View className={cx('gap-md pb-5.5', afterAlerts ? 'pt-3.5' : 'pt-4.5')}>
      <SectionHeading title={t('home.lastNoted')} count={when} />
      {press}
    </View>
  );
}

/** A wide Genel Bakış section's content under its ruled heading: 12 under the rule, 10 over the next heading. */
export function WideSectionBody({ children }: { children: ReactNode }) {
  return <View className="pt-md pb-2.5">{children}</View>;
}
