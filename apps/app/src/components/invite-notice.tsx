import { Text } from '@homelibra/ui/text';
import { type Colors, useThemedStyles } from '@homelibra/ui/theme';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { contactEmail } from '@/lib/contact';

/** Shown when an address that is not invited tries to sign in: Homelibra is invite-only for now. */
export function InviteNotice() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.notice}>
      <Text variant="bodyStrong">{t('signIn.inviteOnly')}</Text>
      <Text variant="body">
        {t('signIn.inviteOnlyContact')}{' '}
        <Text variant="strong" color="accent" role="link" onPress={() => Linking.openURL(`mailto:${contactEmail}`)}>
          {contactEmail}
        </Text>
      </Text>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    notice: { gap: 6, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.lineSoft },
  });
