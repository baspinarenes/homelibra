import { useCallback } from 'react';

import { useOffline } from './network';
import { useOutbox } from './outbox';

/**
 * For what only works online (Düzenle mode, Kaynağı sil): offline it does
 * not start, and `onOffline` says "Bağlantı gerekiyor"; online, what the
 * outbox still had to send goes first, so the operation sees every Note
 * (#58, spec #40). On the web nothing waits, and offline is the browser's.
 */
export function useOnlineFirst(onOffline: () => void) {
  const offline = useOffline();
  const { drain } = useOutbox();
  return useCallback(
    async (action: () => void) => {
      if (offline) return onOffline();
      await drain();
      action();
    },
    [offline, drain, onOffline],
  );
}
