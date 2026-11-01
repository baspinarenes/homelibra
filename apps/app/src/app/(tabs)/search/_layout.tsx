import { SearchTips } from '@/components/search-tips';
import { TabStack } from '@/components/tab-stack';

// Ara's title with Arama ipuçları beside it; the screen sets its own Süz icon.
export default function SearchStack() {
  return <TabStack title="tabs.search" titleAccessory={() => <SearchTips />} />;
}
