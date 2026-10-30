import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { SignOutWarning } from '@/components/sign-out-warning';
import { authClient } from '@/lib/auth-client';
import { useOutbox } from '@/lib/outbox';
import { forgetQueries } from '@/lib/query-provider';
import { type Colors, space, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Signs out this device only; the scholar's other sessions stay open. With
 * Notes still waiting in the phone's outbox, it warns first (#58).
 */
export function SignOutButton() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { waiting } = useOutbox().state;
  const [warning, setWarning] = useState(false);
  const signOut = async () => {
    setWarning(false);
    await authClient.signOut();
    await forgetQueries();
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => (waiting > 0 ? setWarning(true) : void signOut())}
        style={styles.button}
      >
        <Text style={styles.text}>{t('account.signOut')}</Text>
      </Pressable>
      <SignOutWarning visible={warning} onSignOut={() => void signOut()} onCancel={() => setWarning(false)} />
    </>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    button: { paddingHorizontal: space.md, paddingVertical: space.xs },
    text: { ...typeScale.button, color: c.accent },
  });
