import { collectionToMarkdown, type MarkdownCollection } from '@homelibra/core/markdown';
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
 * "Markdown olarak kopyala" in a Collection's header (#12): the Notes the
 * screen shows, in its order, in the one format, no options and no preview.
 * The text is made here from what is on screen and goes to the clipboard
 * within the tap (#7: the web allows it only then), then "Kopyalandı · n
 * not" and a tick for a moment. Faded when there is nothing to copy. The
 * server only counts the copy, on the side, unawaited.
 */
export function CopyMarkdownAction({ view }: { view: MarkdownCollection }) {
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
 * "Dosyayı sil" in a Collection's header: without asking, with Geri al
 * (#36). Notes and Tags stay; Geri al also brings back a Tag only this
 * Collection kept. The scholar goes back to Dizin, where the Geri al bar
 * shows.
 */
export function DeleteCollectionAction({ collection }: { collection: { id: string; name: string } }) {
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

  return (
    <HeaderIconAction
      icon={Trash}
      tone="danger"
      label={t('collectionActions.delete')}
      onPress={() => remove.mutate({ id: collection.id })}
      disabled={remove.isPending}
    />
  );
}
