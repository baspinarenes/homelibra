import { useState } from 'react';

import { loadDeviceChoice, saveDeviceChoice } from '@/lib/device-choice';

/** Dosyalar's order in Dizin: Son değişen, Ada göre, Not sayısı. */
export const collectionSorts = ['recent', 'name', 'notes'] as const;
export type CollectionSort = (typeof collectionSorts)[number];

/** Etiketler's order in Dizin: Çok kullanılan, Ada göre. */
export const tagSorts = ['usage', 'name'] as const;
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
