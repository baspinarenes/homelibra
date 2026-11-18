import { ablativeTr } from '@homelibra/core';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uuidv7 } from 'uuidv7';

import { useOutbox } from '@/lib/outbox';
import { offerReceiptUndo } from '@/lib/undo';

/**
 * The Note being written, wherever it is written: the phone's writing sheet
 * (#157), a wide Source page's column (#177). Its Konum starts as
 * `carriedLocator`, the Locator of the Note captured last, and stays from
 * one save to the next; Alıntı, Yorum and the Tags empty on each save.
 * `save` goes through the outbox, which sends now or once the connection
 * returns (#58); a failure comes back only where there is no outbox (the
 * web). Sent again unchanged after a failure, the Note keeps its id, so it
 * is never made twice. Saved, `onSaved` gets its id and "Not kaydedildi ·
 * Geri al" is offered.
 */
export function useNoteCapture({
  sourceId,
  carriedLocator,
  onSaved,
}: {
  sourceId: string;
  carriedLocator: string;
  onSaved: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { apply } = useOutbox();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [comment, setComment] = useState('');
  const [locator, setLocator] = useState(carriedLocator);
  // The Tags for the Note being written; untagged is the default, and each save starts untagged again.
  const [tags, setTags] = useState<string[]>([]);
  // The id a failed save used, kept while nothing changes, so sending the
  // same Note again cannot make a second one.
  const attempt = useRef<{ id: string; key: string } | null>(null);

  const hasText = excerpt.trim() !== '' || comment.trim() !== '';

  // What a Note's save or a discarded draft empties; the Locator stays.
  const clearDraft = () => {
    setExcerpt('');
    setComment('');
    setTags([]);
  };

  /** Saves the Note; true once it is saved (the draft then empty). */
  const save = async (): Promise<boolean> => {
    if (!hasText || busy) return false;
    setBusy(true);
    setFailed(false);
    try {
      const note = { sourceId, locator, tags, excerpt, comment };
      const key = JSON.stringify(note);
      if (attempt.current?.key !== key) attempt.current = { id: uuidv7(), key };
      const { id } = attempt.current;
      await apply({ type: 'createNote', note: { id, ...note } });
      attempt.current = null;
      onSaved(id);
      clearDraft();
      // Geri al takes the Note away as Notu sil does, offline too.
      offerReceiptUndo(t('capture.saved'), async () => {
        await apply({ type: 'deleteNote', id });
      });
      return true;
    } catch {
      setFailed(true);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const trimmedLocator = locator.trim();
  return {
    excerpt,
    setExcerpt,
    comment,
    setComment,
    locator,
    setLocator,
    trimmedLocator,
    /** Where the next Note goes on from: "s. 52'den devam"; null with no Locator. */
    carriedOn: trimmedLocator ? t('capture.carriedOn', { from: ablativeTr(trimmedLocator) }) : null,
    tags,
    setTags,
    hasText,
    busy,
    failed,
    save,
    /** Throws the draft away, as a discarded sheet does; the Locator stays. */
    discard: () => {
      clearDraft();
      setFailed(false);
      attempt.current = null;
    },
  };
}
