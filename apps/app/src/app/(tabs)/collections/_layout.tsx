import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { useRouter } from 'expo-router';
import Plus from 'lucide-react-native/icons/plus';
import { useTranslation } from 'react-i18next';

import { TabStack } from '@/components/tab-stack';

/** Dizin: its large title, and "+" at the top right for a Yeni dosya. */
export default function CollectionsStack() {
  return <TabStack title="tabs.collections" rootHeader headerRight={() => <NewCollectionButton />} />;
}

function NewCollectionButton() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <HeaderIconAction
      icon={Plus}
      size={24}
      label={t('collections.new')}
      onPress={() => router.push('/collection/new')}
    />
  );
}
