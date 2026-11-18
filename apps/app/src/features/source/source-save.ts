import { useMutation } from '@tanstack/react-query';

import { useGiveSuggestedCover } from '@/features/source/isbn-suggestion';
import { draftToInput, type SourceDraft } from '@/features/source/source-draft';
import { trpcClient } from '@/lib/trpc';

/**
 * Saving a new Source from the form, then giving it the Open Library cover
 * accepted there; `onSaved` gets its id. Online only: the outbox carries
 * Notes, not Sources (#58).
 */
export function useCreateSource(onSaved: (id: string) => unknown) {
  const giveCover = useGiveSuggestedCover();
  return useMutation({
    mutationFn: async (draft: SourceDraft) => {
      const { id } = await trpcClient.sources.create.mutate(draftToInput(draft));
      await giveCover(id, draft.suggestedCover);
      return id;
    },
    onSuccess: onSaved,
  });
}

/** Saving the form over Source `id`, then giving it the Open Library cover accepted there. */
export function useUpdateSource(id: string, onSaved: () => unknown) {
  const giveCover = useGiveSuggestedCover();
  return useMutation({
    mutationFn: async (draft: SourceDraft) => {
      await trpcClient.sources.update.mutate({ id, ...draftToInput(draft) });
      await giveCover(id, draft.suggestedCover);
    },
    onSuccess: onSaved,
  });
}
