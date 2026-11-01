import { Button } from '@homelibra/ui/button';
import { SectionText } from '@homelibra/ui/section-heading';
import { type Colors, space, type as typeScale, useThemedStyles } from '@homelibra/ui/theme';
import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { apiUrl } from '@/lib/api-url';
import { downloadLibraryExport } from '@/lib/library-export';

/**
 * "Kütüphaneni indir" (#40, stories 16-18): the whole Library as one ZIP,
 * downloaded on the web. The app on a phone sends the scholar to the web,
 * where the file can be saved and opened.
 */
export function LibraryExportDownload() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const download = useMutation({ mutationFn: downloadLibraryExport });

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.block}>
        <SectionText>{t('libraryExport.onWeb')}</SectionText>
        <Text accessibilityRole="link" style={styles.link} onPress={() => Linking.openURL(`${apiUrl}/settings/export`)}>
          {t('libraryExport.openWeb')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Button label={t('libraryExport.download')} busy={download.isPending} onPress={() => download.mutate()} />
      {download.isPending ? <Text style={styles.note}>{t('libraryExport.preparing')}</Text> : null}
      {download.isError ? <Text style={styles.error}>{t('libraryExport.failed')}</Text> : null}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    block: { gap: space.sm, paddingTop: space.sm },
    link: { ...typeScale.label, color: c.accent },
    note: { ...typeScale.caption, color: c.muted },
    error: { ...typeScale.label, color: c.warn },
  });
