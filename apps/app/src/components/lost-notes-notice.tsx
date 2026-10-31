import { Strip } from '@homelibra/ui/strip';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useOutbox } from '@/lib/outbox';

/** How many Notes on the phone wait for a new Source, theirs deleted elsewhere (#58). None on the web, which has no outbox. */
export function useLostNoteCount() {
  const { status } = useOutbox().state;
  return [...status.values()].filter((s) => s === 'sourceGone').length;
}

/**
 * The "N notun kaynağı silinmiş" strip on Genel bakış, while the phone holds
 * Notes whose Source was deleted elsewhere: they wait for a new Source and
 * are never dropped unseen. Opens their list. Nothing otherwise.
 */
export function LostNotesNotice() {
  const { t } = useTranslation();
  const router = useRouter();
  const count = useLostNoteCount();
  if (count === 0) return null;
  return <Strip title={t('outbox.lostNotes', { count })} onPress={() => router.push('/lost-notes')} />;
}
