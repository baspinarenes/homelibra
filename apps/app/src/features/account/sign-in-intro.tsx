import { Chip } from '@homelibra/ui/chip';
import { AppLogo } from '@homelibra/ui/logo';
import { Text } from '@homelibra/ui/text';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { TemplateCover } from '@/features/source/template-cover';

// Uniwind reads className only on React Native's own components.

/**
 * Giriş's left half on a wide screen (Giriş 4, #184): the logo, what Homelibra
 * is for, and its three steps (a Source, a Note, a Collection), each with a
 * small example drawn as the app draws it. The examples only show: nothing
 * here is a button.
 */
export function SignInIntro() {
  const { t } = useTranslation();
  const steps = [
    { key: 'source', example: <SourceExample /> },
    { key: 'note', example: <NoteExample /> },
    { key: 'collection', example: <CollectionExample /> },
  ] as const;
  return (
    <ScrollView className="flex-1" contentContainerClassName="grow gap-7 px-14 py-9">
      <View className="flex-row items-center gap-4">
        <AppLogo size={64} label={t('signIn.logo')} />
        <Text variant="display" role={undefined}>
          {t('signIn.title')}
        </Text>
      </View>
      <View className="mt-2 gap-3">
        <Text variant="micro" color="accent">
          {t('signInIntro.eyebrow')}
        </Text>
        <Text variant="hero" className="max-w-[720px]">
          {t('signInIntro.title')}
        </Text>
        <Text variant="bodyLg" color="ink2" className="max-w-[600px]">
          {t('signInIntro.lead')}
        </Text>
      </View>
      <View className="mt-3 flex-row gap-8">
        {steps.map(({ key, example }, i) => (
          <Step
            key={key}
            number={String(i + 1).padStart(2, '0')}
            title={t(`signInIntro.steps.${key}.title`)}
            text={t(`signInIntro.steps.${key}.text`)}
          >
            {example}
          </Step>
        ))}
      </View>
      {/* Pinned to the foot of a tall window, right after the steps on a short one. */}
      <Text variant="caption" className="mt-auto">
        {t('welcome.features.export')}
      </Text>
    </ScrollView>
  );
}

function Step({ number, title, text, children }: { number: string; title: string; text: string; children: ReactNode }) {
  return (
    <View className="min-w-0 flex-1 gap-2.5 border-t border-quote-bar pt-3.5">
      <Text variant="collectionCount" color="accent">
        {number}
      </Text>
      <Text variant="summary" color="fg" role="heading">
        {title}
      </Text>
      <Text variant="bodySm" color="ink2">
        {text}
      </Text>
      <View className="mt-1.5">{children}</View>
    </View>
  );
}

/** Two Sources of different types, as a list row shows them: the sample names the Kaynak formu shows. */
function SourceExample() {
  const { t } = useTranslation();
  const rows = [
    { type: 'book', title: t('sourceTypes.book.titleExample'), meta: t('sourceTypes.book.authorExample') },
    {
      type: 'periodical',
      title: t('sourceTypes.periodical.titleExample'),
      meta: t('signInIntro.examples.periodicalPlace'),
    },
  ] as const;
  return (
    <View className="gap-2">
      {rows.map(({ type, title, meta }) => (
        <View key={type} className="flex-row items-center gap-2.5">
          <TemplateCover type={type} />
          <View className="min-w-0 flex-1">
            <Text variant="micro">{t(`sourceTypes.${type}.label`)}</Text>
            <Text variant="sourceTitleSm">{title}</Text>
            <Text variant="caption">{meta}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** A Note in its parts, with the composer's own placeholders for words, and the Locator the next one starts from. */
function NoteExample() {
  const { t } = useTranslation();
  return (
    <View className="gap-1">
      <Text variant="locator" color="accent">
        {t('signInIntro.examples.locator')}
      </Text>
      <Text variant="excerpt" className="border-l-2 border-quote-bar pl-2.75">
        {t('capture.excerptPlaceholder')}
      </Text>
      <Text variant="commentSm">{t('capture.commentPlaceholder')}</Text>
      <Text variant="locator" className="mt-1.5">
        {t('capture.carriedOn', { from: t('signInIntro.examples.locatorFrom') })}
      </Text>
    </View>
  );
}

/** A Collection: its name, the Tags that make it, its counts and the copy it offers. */
function CollectionExample() {
  const { t } = useTranslation();
  return (
    <View className="gap-1.5">
      <Text variant="sourceTitleSm">{t('signInIntro.examples.collectionName')}</Text>
      <View className="flex-row flex-wrap gap-1">
        {t('signInIntro.examples.tags', { returnObjects: true }).map((tag) => (
          <Chip key={tag} label={tag} />
        ))}
      </View>
      <Text variant="collectionCount">{t('collection.counts', { notes: 12, sources: 4 })}</Text>
      <View className="mt-0.5 self-start rounded-control border border-line bg-surface px-2 py-1">
        <Text variant="labelSm">{t('collectionActions.copy')}</Text>
      </View>
    </View>
  );
}
