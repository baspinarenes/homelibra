import { type ListedNote, pendingNote } from '@homelibra/outbox';
import { QueryObserver } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { knownNotes } from './known-notes';
import { refreshLibrary } from '@/lib/refresh-library';
import { queryClient } from '@/lib/trpc';

vi.mock('@/lib/trpc', async () => {
  const { QueryClient } = await import('@tanstack/react-query');
  const router = (name: string) => ({ pathKey: () => [[name]] });
  const procedure = (name: string) => ({ pathKey: () => [['notes', name]] });
  return {
    queryClient: new QueryClient(),
    trpcOptions: {
      notes: { ...router('notes'), list: procedure('list'), get: procedure('get') },
      sources: router('sources'),
      search: router('search'),
      tags: router('tags'),
      collections: router('collections'),
    },
  };
});

const SOURCE = '01900000-0000-7000-8000-00000000000a';
const NOTE = '01900000-0001-7000-8000-000000000001';

const original = { id: NOTE, locator: null, locatorSort: null, excerpt: 'Alıntı', comment: 'Yorum', tags: [] };
const edited = { ...original, locator: 's. 42', locatorSort: [42], excerpt: null };

const listKey = [['notes', 'list'], { input: { sourceId: SOURCE }, type: 'query' }];
const openedKey = [['notes', 'get'], { input: { id: NOTE }, type: 'query' }];

/** Long enough that two fetches never carry the same dataUpdatedAt. */
const aMoment = () => new Promise((resolve) => setTimeout(resolve, 2));

afterEach(() => queryClient.clear());

describe('knownNotes', () => {
  it('gives the saved Note when the edit screen closed before the reply came', async () => {
    let server: ListedNote = original;
    const list = async () => [server];
    // The Source page stays mounted under the edit screen; the edit screen has left.
    const page = new QueryObserver(queryClient, { queryKey: listKey, queryFn: list });
    const leavePage = page.subscribe(() => {});
    await queryClient.fetchQuery({ queryKey: listKey, queryFn: list });
    await queryClient.fetchQuery({ queryKey: openedKey, queryFn: async () => ({ ...server, sourceId: SOURCE }) });

    await aMoment();
    server = edited;
    await refreshLibrary();
    leavePage();

    expect(pendingNote(NOTE, [], knownNotes())).toMatchObject({ locator: 's. 42', excerpt: null, comment: 'Yorum' });
  });

  it('gives what the edit screen fetched when that is newer than the list', async () => {
    queryClient.setQueryData(listKey, [original]);
    await aMoment();
    queryClient.setQueryData(openedKey, { ...edited, sourceId: SOURCE });

    expect(pendingNote(NOTE, [], knownNotes())).toMatchObject({ locator: 's. 42', excerpt: null });
  });
});
