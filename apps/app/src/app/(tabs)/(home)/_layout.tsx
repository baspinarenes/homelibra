import { SignOutButton } from '@/components/sign-out-button';
import { TabStack } from '@/components/tab-stack';

export default function HomeStack() {
  return <TabStack title="tabs.home" headerRight={() => <SignOutButton />} />;
}
