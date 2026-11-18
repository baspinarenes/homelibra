import type { NoteStatus } from '@homelibra/outbox';
import { Text } from '@homelibra/ui/text';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOffline } from '@/lib/network';
import { useOutbox } from '@/lib/outbox';

/**
 * "Çevrimdışı · N not bekliyor" in the top bar while the phone is offline,
 * so the scholar knows the Notes taken are kept and not yet sent (#57).
 * Online, a Note is sent as it is captured; each row says where it is.
 */
export function OutboxStatus() {
  const { t } = useTranslation();
  const offline = useOffline();
  const { waiting } = useOutbox().state;
  if (!offline) return null;
  const text = [t('outbox.offline'), waiting > 0 && t('outbox.waiting', { count: waiting })]
    .filter(Boolean)
    .join(' · ');
  return (
    <Text variant="label" color="warn" role="status" numberOfLines={1}>
      {text}
    </Text>
  );
}

// How long a Note is sent before its row says "gönderiliyor", in ms: a quick send says nothing.
const slowSendAfter = 1000;

/**
 * The status a Note's row says, from where the phone's outbox has it:
 * nothing once sent, nor while a send takes under {@link slowSendAfter}.
 */
export function useShownStatus(status: NoteStatus | undefined) {
  const sending = status === 'sending';
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!sending) return;
    const timer = setTimeout(() => setSlow(true), slowSendAfter);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [sending]);
  return status === 'synced' || (sending && !slow) ? undefined : status;
}
