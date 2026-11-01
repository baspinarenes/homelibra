import { useSyncExternalStore } from 'react';

import { loadDeviceChoice, saveDeviceChoice } from '@/lib/device-choice';

/**
 * A choice for Genel Bakış in Ayarlar' Görünüm, kept on this device only and
 * read from it on first use. A store rather than state: Ayarlar changes it
 * while Genel Bakış stays mounted. Without a choice, the first of `allowed`.
 */
function keptChoice<T extends string>(key: string, allowed: readonly [T, ...T[]]) {
  let value: T | undefined;
  const listeners = new Set<() => void>();
  const current = () => (value ??= loadDeviceChoice(key, allowed));
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const use = (): T => useSyncExternalStore(subscribe, current, current);
  const set = (next: T) => {
    value = next;
    saveDeviceChoice(key, next);
    listeners.forEach((listener) => listener());
  };
  return [use, set] as const;
}

/** How Kaldığın yer is laid out: the Note on top (Not önde), or the Source (Kaynak önde). */
export type LastNotedLayout = 'note' | 'source';
export const [useLastNotedLayout, setLastNotedLayout] = keptChoice<LastNotedLayout>('homelibra.home.lastNotedLayout', [
  'note',
  'source',
]);

/** What stands between Genel Bakış's sections: a rule edge to edge (Çizgi), or an 8px band (Şerit). */
export type HomeDivider = 'rule' | 'band';
export const [useHomeDivider, setHomeDivider] = keptChoice<HomeDivider>('homelibra.home.divider', ['rule', 'band']);
