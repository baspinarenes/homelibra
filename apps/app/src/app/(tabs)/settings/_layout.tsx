import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TabStack } from '@/components/tab-stack';

export default function SettingsStack() {
  const { t } = useTranslation();
  return (
    <TabStack title="tabs.settings">
      <Stack.Screen name="privacy" options={{ title: t('privacy.title') }} />
      <Stack.Screen name="email" options={{ title: t('emailChange.title') }} />
      <Stack.Screen name="delete" options={{ title: t('accountDeletion.title') }} />
      <Stack.Screen name="export" options={{ title: t('libraryExport.title') }} />
    </TabStack>
  );
}
