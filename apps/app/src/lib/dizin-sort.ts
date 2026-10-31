import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Dosyalar's order in Dizin: Son değişen, Ada göre, Not sayısı. */
export const collectionSorts = ['recent', 'name', 'notes'] as const;
export type CollectionSort = (typeof collectionSorts)[number];

/** Etiketler's order in Dizin: Çok kullanılan, Ada göre. */
export const tagSorts = ['usage', 'name'] as const;
export type TagSort = (typeof tagSorts)[number];

const keys = { collections: 'homelibra.dizin.collectionSort', tags: 'homelibra.dizin.tagSort' } as const;

/**
 * Each view's order is kept on this device only, as the theme is
 * (`theme-preference.ts`): SecureStore on the phone, localStorage on web.
 * Read synchronously, so Dizin opens in the order it was left in.
 */
function load<T extends string>(key: string, allowed: readonly T[]): T {
  try {
    const value = Platform.OS === 'web' ? window.localStorage.getItem(key) : SecureStore.getItem(key);
    return allowed.find((sort) => sort === value) ?? allowed[0]!;
  } catch {
    return allowed[0]!;
  }
}

function save(key: string, value: string) {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(key, value);
    else void SecureStore.setItemAsync(key, value).catch(() => {});
  } catch {
    // An order that cannot be stored still applies until the app restarts.
  }
}

export const loadCollectionSort = () => load(keys.collections, collectionSorts);
export const saveCollectionSort = (sort: CollectionSort) => save(keys.collections, sort);
export const loadTagSort = () => load(keys.tags, tagSorts);
export const saveTagSort = (sort: TagSort) => save(keys.tags, sort);
