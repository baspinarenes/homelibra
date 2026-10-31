import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { useOffline } from '@/lib/network';
import { useOutbox } from '@/lib/outbox';
import { type Colors, type as typeScale, useThemedStyles } from '@/theme';

/**
 * "Çevrimdışı · N not bekliyor" in the top bar while the phone is offline,
 * so the scholar knows the Notes taken are kept and not yet sent (#57).
 * Online, a Note is sent as it is captured; each row says where it is.
 */
export function OutboxStatus() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const offline = useOffline();
  const { waiting } = useOutbox().state;
  if (!offline) return null;
  const text = [t('outbox.offline'), waiting > 0 && t('outbox.waiting', { count: waiting })]
    .filter(Boolean)
    .join(' · ');
  return (
    <Text role="status" style={styles.text} numberOfLines={1}>
      {text}
    </Text>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    text: { ...typeScale.label, color: c.warn },
  });
