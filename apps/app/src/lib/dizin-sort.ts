import type { AppRouter } from '@homelibra/api';
import type { inferRouterInputs } from '@trpc/server';
import { useState } from 'react';

import { loadDeviceChoice, saveDeviceChoice } from '@/lib/device-choice';

type Inputs = inferRouterInputs<AppRouter>;

/** Dosyalar's order in Dizin: Son değişen, Ada göre, Not sayısı; every order `collections.list` takes. */
export type CollectionSort = Exclude<Inputs['collections']['list'], void | undefined>['sort'];
const collectionSorts = ['recent', 'name', 'notes'] as const satisfies readonly CollectionSort[];

/** Etiketler's order in Dizin: Çok kullanılan, Ada göre; of the orders `tags.list` takes. */
const tagSorts = ['usage', 'name'] as const satisfies readonly Inputs['tags']['list']['sort'][];
export type TagSort = (typeof tagSorts)[number];

/**
 * A Dizin view's order and the setter that also keeps it on this device, as
 * the theme is: Dizin opens in the order it was left in.
 */
function useKeptSort<T extends string>(key: string, allowed: readonly [T, ...T[]]): [T, (next: T) => void] {
  const [sort, setSort] = useState(() => loadDeviceChoice(key, allowed));
  const keep = (next: T) => {
    setSort(next);
    saveDeviceChoice(key, next);
  };
  return [sort, keep];
}

export const useCollectionSort = () => useKeptSort('homelibra.dizin.collectionSort', collectionSorts);
export const useTagSort = () => useKeptSort('homelibra.dizin.tagSort', tagSorts);
