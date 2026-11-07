import { Text } from '@homelibra/ui/text';

import { useOffline } from '@/lib/network';

/**
 * Says, while the device is offline, that what this screen does needs a
 * connection (#58): only Notes go into the outbox, so adding, saving or
 * deleting a Source waits for the network. Nothing online.
 */
export function OfflineNotice({ message }: { message: string }) {
  const offline = useOffline();
  if (!offline) return null;
  return (
    <Text variant="body" color="warn" role="status">
      {message}
    </Text>
  );
}
