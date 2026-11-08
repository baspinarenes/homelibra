import { Button } from '@homelibra/ui/button';
import { SectionText } from '@homelibra/ui/section-heading';
import { Text } from '@homelibra/ui/text';
import { space } from '@homelibra/ui/theme';
import { useMutation } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';

import { apiUrl } from '@/lib/api-url';
import { downloadLibraryExport } from '@/lib/library-export';

/**
 * "Kütüphaneni indir" (#40, stories 16-18): the whole Library as one ZIP,
 * downloaded on the web. The app on a phone sends the scholar to the web,
 * where the file can be saved and opened.
 */
export function LibraryExportDownload() {
  const { t } = useTranslation();
  const download = useMutation({ mutationFn: downloadLibraryExport });

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.block}>
        <SectionText>{t('libraryExport.onWeb')}</SectionText>
        <Text
          variant="label"
          color="accent"
          accessibilityRole="link"
          onPress={() => Linking.openURL(`${apiUrl}/settings/export`)}
        >
          {t('libraryExport.openWeb')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Button label={t('libraryExport.download')} busy={download.isPending} onPress={() => download.mutate()} />
      {download.isPending ? <Text variant="caption">{t('libraryExport.preparing')}</Text> : null}
      {download.isError ? (
        <Text variant="label" color="warn">
          {t('libraryExport.failed')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space.sm, paddingTop: space.sm },
});
