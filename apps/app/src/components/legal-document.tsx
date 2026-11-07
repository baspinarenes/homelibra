import { Text } from '@homelibra/ui/text';
import { type Colors, space, useThemedStyles } from '@homelibra/ui/theme';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { type LegalSection, legalVersion } from '@/lib/legal';

/** The full privacy notice or terms of use, with the version an Account accepts. */
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
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
      <Text variant="caption">{t('privacy.version', { version: legalVersion })}</Text>
    </ScrollView>
  );
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
