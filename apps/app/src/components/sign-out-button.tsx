import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { queryClient } from '@/lib/trpc';
import { colors, space } from '@/theme';

/** Signs out this device only; the scholar's other sessions stay open. */
export function SignOutButton() {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={async () => {
        await authClient.signOut();
        queryClient.clear();
      }}
      style={styles.button}
    >
      <Text style={styles.text}>{t('account.signOut')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingHorizontal: space.md, paddingVertical: space.xs },
  text: { color: colors.accent, fontSize: 15 },
});
