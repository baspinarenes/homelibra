import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { type LegalSection, legalVersion } from '@/lib/legal';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** The full privacy notice or terms of use, with the version an Account accepts. */
export function LegalDocument({ sections }: { sections: LegalSection[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          {section.paragraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      ))}
      <Text style={styles.version}>{t('privacy.version', { version: legalVersion })}</Text>
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
    heading: { ...typeScale.sourceTitle, color: c.fg },
    paragraph: { ...typeScale.body, color: c.ink3 },
    version: { ...typeScale.caption, color: c.muted },
  });
