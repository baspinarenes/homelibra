import { useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { TabStack } from '@/components/tab-stack';
import { space, useTheme } from '@/theme';

export default function SourcesStack() {
  return <TabStack title="tabs.sources" headerRight={() => <AddSourceButton />} />;
}

function AddSourceButton() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('sources.add')}
      onPress={() => router.push('/source/new')}
      hitSlop={8}
      style={{ paddingHorizontal: space.sm }}
    >
      <Plus color={colors.accent} size={22} strokeWidth={1.6} />
    </Pressable>
  );
}
