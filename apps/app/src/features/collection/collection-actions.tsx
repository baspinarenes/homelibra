import {
  collectionToMarkdown,
  type MarkdownCollection,
  type MarkdownNote,
  type MarkdownSource,
  sourceToMarkdown,
} from '@homelibra/core/markdown';
import { HeaderIconAction } from '@homelibra/ui/screen-header';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import Check from 'lucide-react-native/icons/check';
import Copy from 'lucide-react-native/icons/copy';
import Trash from 'lucide-react-native/icons/trash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTRPC } from '@/lib/trpc';
import { offerServerUndo, offerUndo } from '@/lib/undo';

/** How long the copy icon shows its tick after a copy. */
const COPIED_MS = 2000;

/**
 * "Markdown olarak kopyala" (#12): the Notes the screen shows, in its
 * order, in the one format, no options and no preview. The text is made
 * here from what is on screen and goes to the clipboard within the press or
 * the key (#7: the web allows it only then), then "Kopyalandı · n not".
 * The server only counts the copy, on the side, unawaited. `done` is true
 * for a moment after a copy; `count` is how many Notes it copies.
 */
export function useCopyMarkdown(view: MarkdownCollection) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const copied = useMutation(trpc.collections.copied.mutationOptions());
  const [done, setDone] = useState(false);
  const count = view.groups.reduce((sum, group) => sum + group.notes.length, 0);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [done]);

  const copy = () => {
    Clipboard.setStringAsync(collectionToMarkdown(view)).then(
      () => {
        offerUndo({ message: t('collectionActions.copied', { count }) });
        setDone(true);
        copied.mutate();
      },
      () => offerUndo({ message: t('collectionActions.copyFailed') }),
    );
  };
  return { copy, done, count };
}

/** Kopyala ⌘C in a wide screen's panel: the one Note, under its Source's line, as Markdown. */
export function copyNoteMarkdown(
  source: MarkdownSource,
  note: MarkdownNote,
  messages: { done: string; failed: string },
) {
  copySourceMarkdown(source, [note], messages);
}

/** "Markdown olarak kopyala" in a wide Source page's ⋯ (⌘⇧C): the Source's Notes the page lists, in its order. */
export function copySourceMarkdown(
  source: MarkdownSource,
  notes: MarkdownNote[],
  messages: { done: string; failed: string },
) {
  Clipboard.setStringAsync(sourceToMarkdown(source, notes)).then(
    () => offerUndo({ message: messages.done }),
    () => offerUndo({ message: messages.failed }),
  );
}

/** The copy in a Collection's header on the phone: a tick for a moment after it, faded when there is nothing to copy. */
export function CopyMarkdownAction({ view }: { view: MarkdownCollection }) {
  const { t } = useTranslation();
  const { copy, done, count } = useCopyMarkdown(view);
  return (
    <HeaderIconAction
      icon={done ? Check : Copy}
      label={t('collectionActions.copy')}
      onPress={copy}
      disabled={count === 0}
    />
  );
}

/**
 * "Dosyayı sil": without asking, with Geri al (#36). Notes and Tags stay;
 * Geri al also brings back a Tag only this Collection kept. The scholar
 * goes back to Dizin, where the Geri al bar shows.
 */
export function useDeleteCollection(collection: { id: string; name: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const remove = useMutation(
    trpc.collections.delete.mutationOptions({
      onSuccess: ({ undoToken }) => {
        if (router.canGoBack()) router.back();
        else router.replace('/collections');
        offerServerUndo(t('collectionActions.deleted', { name: collection.name }), undoToken);
        // Not the view itself: it is closing, and asked again it is not found.
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.collections.list.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.tags.pathKey() }),
        ]);
      },
      onError: () => offerUndo({ message: t('collectionActions.deleteFailed') }),
    }),
  );
  return { remove: () => remove.mutate({ id: collection.id }), busy: remove.isPending };
}

/** "Dosyayı sil" in a Collection's header on the phone. */
export function DeleteCollectionAction({ collection }: { collection: { id: string; name: string } }) {
  const { t } = useTranslation();
  const { remove, busy } = useDeleteCollection(collection);
  return (
    <HeaderIconAction
      icon={Trash}
      tone="danger"
      label={t('collectionActions.delete')}
      onPress={remove}
      disabled={busy}
    />
  );
}
