import { cx } from '@homelibra/ui/theme';
import { Text } from '@homelibra/ui/text';
import { useWideLayout } from '@homelibra/ui/wide-layout';
import * as Linking from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
import { type ReactNode, type RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  View,
} from 'react-native';

import { contactEmail } from '@/features/privacy/contact';
import { contentsOf, sectionAt } from '@/features/privacy/contents';
import { type LegalSection, legalVersion } from '@/features/privacy/legal';

/**
 * The full privacy notice or terms of use, with the version an Account
 * accepts. The contact address opens a new e-mail wherever the text names it.
 * On a wide screen the text is a 680 px reading column under its title, its
 * headings listed on the left when it has three or more (#185): a heading
 * there scrolls the text to its section, and the one being read is marked.
 */
export function LegalDocument({ title, sections }: { title: string; sections: LegalSection[] }) {
  const { t } = useTranslation();
  const wide = useWideLayout().tier === 'wide';
  if (wide) return <WideLegalDocument title={title} sections={sections} />;
  return (
    <ScrollView
      className="flex-1 bg-page"
      contentContainerClassName="w-full max-w-[640px] gap-xl self-center px-lg py-lg"
    >
      {sections.map((section) => (
        <View key={section.heading} className="gap-sm">
          <Text variant="sourceTitle">{section.heading}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} variant="body" color="ink3">
              {withContactLinks(paragraph, 'body')}
            </Text>
          ))}
        </View>
      ))}
      <Text variant="caption">{t('privacy.version', { version: legalVersion })}</Text>
    </ScrollView>
  );
}

function WideLegalDocument({ title, sections }: { title: string; sections: LegalSection[] }) {
  const { t } = useTranslation();
  const scroll = useRef<ScrollViewInstance>(null);
  // Each section's top in the text, measured as it lays out; one not yet measured is never reached.
  const tops = useRef<number[]>(sections.map(() => Infinity));
  const [reading, setReading] = useState(0);
  const contents = contentsOf(sections);

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    setReading(
      sectionAt({
        tops: tops.current,
        offset: nativeEvent.contentOffset.y,
        viewport: nativeEvent.layoutMeasurement.height,
        content: nativeEvent.contentSize.height,
      }),
    );
  };

  return (
    <ReadingColumn
      back="/privacy"
      scrollRef={scroll}
      onScroll={contents ? onScroll : undefined}
      aside={
        contents ? (
          <View role="navigation" aria-label={t('privacy.contents')} className="gap-0.5">
            <Text variant="micro" className="px-2.5 pb-1.5">
              {t('privacy.contents')}
            </Text>
            {contents.map((heading, i) => (
              <Pressable
                key={heading}
                role="link"
                aria-current={i === reading ? 'location' : undefined}
                className={cx('rounded-chip px-2.5 py-1.75', i === reading ? 'bg-accent-soft' : undefined)}
                onPress={() => scroll.current?.scrollTo({ y: tops.current[i], animated: true })}
              >
                <Text variant="bodySm" color={i === reading ? 'accent' : 'ink3'}>
                  {heading}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null
      }
    >
      <View className="gap-1 pb-1.5">
        <Text variant="micro">{t('privacy.title')}</Text>
        <Text variant="display" role="heading">
          {title}
        </Text>
      </View>
      {sections.map((section, i) => (
        // Its top above the heading's space, so a section scrolled to keeps a little page over its heading.
        <View
          key={section.heading}
          className="gap-3.5 pt-6.5"
          onLayout={(event) => {
            tops.current[i] = event.nativeEvent.layout.y;
          }}
        >
          <Text variant="sourceTitle" role="heading">
            {section.heading}
          </Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} variant="reading">
              {withContactLinks(paragraph, 'reading')}
            </Text>
          ))}
        </View>
      ))}
      <Text variant="caption" className="pt-6.5">
        {t('privacy.version', { version: legalVersion })}
      </Text>
    </ReadingColumn>
  );
}

/**
 * A privacy page on a wide screen: the 680 px column it reads in, scrolling
 * on its own, and on its left the way back and whatever the page lists there.
 * The left stays put while the column scrolls. With nowhere to go back to (a
 * page opened by its address), the way back goes to `back`.
 */
export function ReadingColumn({
  back,
  aside,
  scrollRef,
  onScroll,
  children,
}: {
  back: Href;
  aside?: ReactNode;
  scrollRef?: RefObject<ScrollViewInstance | null>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View className="flex-1 flex-row bg-page">
      <View className="mr-12 ml-10 w-[220px] gap-3 pt-7">
        <Text
          variant="link"
          role="link"
          className="self-start"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(back))}
        >
          {t('privacy.back')}
        </Text>
        {aside}
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        // 680 px of text where there is room; narrower beside the sidebar below about 1240 px, never cut off.
        contentContainerClassName="w-full max-w-[720px] pt-7 pr-10 pb-xxl"
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** The paragraph, its every mention of the contact address a link that opens a new e-mail. */
function withContactLinks(paragraph: string, variant: 'body' | 'reading') {
  return paragraph.split(contactEmail).flatMap((text, i) => {
    if (i === 0) return [text];
    const link = (
      <Text
        key={i}
        variant={variant}
        color="accent"
        accessibilityRole="link"
        onPress={() => Linking.openURL(`mailto:${contactEmail}`)}
      >
        {contactEmail}
      </Text>
    );
    return [link, text];
  });
}
