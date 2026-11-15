import { Text } from '@homelibra/ui/text';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { contactEmail } from '@/features/privacy/contact';

/** Shown when an address that is not invited tries to sign in: Homelibra is invite-only for now. */
export function InviteNotice() {
  const { t } = useTranslation();
  return (
    <View className="gap-1.5 border-t border-line-soft pt-4">
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
