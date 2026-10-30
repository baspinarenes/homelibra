import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { forgetQueries } from '@/lib/query-provider';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/** Signs out this device only; the scholar's other sessions stay open. */
export function SignOutButton() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={async () => {
        await authClient.signOut();
        await forgetQueries();
      }}
      style={styles.button}
    >
      <Text style={styles.text}>{t('account.signOut')}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    button: { paddingHorizontal: space.md, paddingVertical: space.xs },
    text: { ...typeScale.button, color: c.accent },
  });
