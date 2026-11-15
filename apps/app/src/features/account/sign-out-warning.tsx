import { Dialog, DialogMessage } from '@homelibra/ui/dialog';
import { Text } from '@homelibra/ui/text';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOffline } from '@/lib/network';
import { useOutbox } from '@/lib/outbox';

/**
 * Asked on sign-out while Notes still wait in the phone's outbox (#58, spec
 * #40): signing out keeps them for this Account, but they are not sent
 * until it signs in here again. "Önce gönder" sends them and then signs
 * out; whatever cannot go (no connection, or Kaynağı silinmiş) is said, and
 * the choice stays. Tapping outside cancels.
 */
export function SignOutWarning({
  visible,
  onSignOut,
  onCancel,
}: {
  visible: boolean;
  onSignOut: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const { state, drain } = useOutbox();
  const offline = useOffline();
  const [sending, setSending] = useState(false);
  const [notSent, setNotSent] = useState(false);

  const cancel = () => {
    setNotSent(false);
    onCancel();
  };
  const sendFirst = async () => {
    if (offline) return setNotSent(true);
    setSending(true);
    const left = await drain();
    setSending(false);
    if (left === 0) onSignOut();
    else setNotSent(true);
  };

  return (
    <Dialog
      visible={visible}
      message={
        <>
          <DialogMessage>{t('outbox.signOutWarning', { count: state.waiting })}</DialogMessage>
          {notSent && (
            <Text variant="body" color="warn" role="status">
              {[t('outbox.notSent', { count: state.waiting }), offline && t('outbox.needsConnection')]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
        </>
      }
      cancelLabel={t('outbox.cancel')}
      alternative={{ label: t('outbox.signOutAnyway'), onPress: onSignOut }}
      confirmLabel={t('outbox.sendFirst')}
      busy={sending}
      onConfirm={() => void sendFirst()}
      onCancel={cancel}
    />
  );
}
