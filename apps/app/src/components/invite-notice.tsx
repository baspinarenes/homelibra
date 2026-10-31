import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { contactEmail } from '@/lib/contact';
import { type Colors, fonts, type as typeScale, useThemedStyles } from '@/theme';

/** Shown when an address that is not invited tries to sign in: Homelibra is invite-only for now. */
export function InviteNotice() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.notice}>
      <Text style={styles.title}>{t('signIn.inviteOnly')}</Text>
      <Text style={styles.body}>
        {t('signIn.inviteOnlyContact')}{' '}
        <Text role="link" style={styles.link} onPress={() => Linking.openURL(`mailto:${contactEmail}`)}>
          {contactEmail}
        </Text>
      </Text>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    notice: { gap: 6, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.lineSoft },
    title: { ...typeScale.body, fontFamily: fonts.sansSemiBold, color: c.fg },
    body: { ...typeScale.body, color: c.ink2 },
    link: { fontFamily: fonts.sansSemiBold, color: c.accent },
  });
