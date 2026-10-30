import { StyleSheet, Text } from 'react-native';

import { useOffline } from '@/lib/network';
import { type Colors, type as typeScale, useThemedStyles } from '@/theme';

/**
 * Says, while the device is offline, that what this screen does needs a
 * connection (#58): only Notes go into the outbox, so adding, saving or
 * deleting a Source waits for the network. Nothing online.
 */
export function OfflineNotice({ message }: { message: string }) {
  const styles = useThemedStyles(makeStyles);
  const offline = useOffline();
  if (!offline) return null;
  return (
    <Text role="status" style={styles.text}>
      {message}
    </Text>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    text: { ...typeScale.body, color: c.warn },
  });
