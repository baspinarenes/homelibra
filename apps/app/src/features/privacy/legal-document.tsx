import { Text } from '@homelibra/ui/text';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { contactEmail } from '@/features/privacy/contact';
import { type LegalSection, legalVersion } from '@/features/privacy/legal';

/**
 * The full privacy notice or terms of use, with the version an Account
 * accepts. The contact address opens a new e-mail wherever the text names it.
 */
export function LegalDocument({ sections }: { sections: LegalSection[] }) {
  const { t } = useTranslation();
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
              {withContactLinks(paragraph)}
            </Text>
          ))}
        </View>
      ))}
      <Text variant="caption">{t('privacy.version', { version: legalVersion })}</Text>
    </ScrollView>
  );
}

/** The paragraph, its every mention of the contact address a link that opens a new e-mail. */
function withContactLinks(paragraph: string) {
  return paragraph.split(contactEmail).flatMap((text, i) => {
    if (i === 0) return [text];
    const link = (
      <Text
        key={i}
        variant="body"
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
