import { Button } from '@homelibra/ui/button';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SignOutWarning } from '@/components/sign-out-warning';
import { authClient } from '@/lib/auth-client';
import { useOutbox } from '@/lib/outbox';
import { forgetQueries } from '@/lib/query-provider';

/**
 * Signs out this device only; the scholar's other sessions stay open. With
 * Notes still waiting in the phone's outbox, it warns first (#58). A text
 * button, so its word sits 4 in from where it stands.
 */
export function SignOutButton() {
  const { t } = useTranslation();
  const { waiting } = useOutbox().state;
  const [warning, setWarning] = useState(false);
  const signOut = async () => {
    setWarning(false);
    await authClient.signOut();
    await forgetQueries();
  };
  return (
    <>
      <Button
        label={t('account.signOut')}
        variant="text"
        onPress={() => (waiting > 0 ? setWarning(true) : void signOut())}
      />
      <SignOutWarning visible={warning} onSignOut={() => void signOut()} onCancel={() => setWarning(false)} />
    </>
  );
}
