import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TabStack } from '@/components/tab-stack';

export default function HomeStack() {
  const { t } = useTranslation();
  return (
    <TabStack title="tabs.home">
      <Stack.Screen name="organize" options={{ title: t('organize.title') }} />
    </TabStack>
  );
}
