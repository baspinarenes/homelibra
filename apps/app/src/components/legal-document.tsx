import { Text } from '@homelibra/ui/text';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { contactEmail } from '@/lib/contact';
import { type LegalSection, legalVersion } from '@/lib/legal';

/**
 * The full privacy notice or terms of use, with the version an Account
 * accepts. The contact address opens a new e-mail wherever the text names it.
 */
export function LegalDocument({ sections }: { sections: LegalSection[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
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

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 640,
      paddingHorizontal: space.lg,
      paddingVertical: space.lg,
      gap: space.xl,
    },
    section: { gap: space.sm },
  });
