import { useState } from 'react';

import { orderOf, type SourceOrder, storedOrder, storedOrders } from '@/features/source/source-order';
import { loadDeviceChoice, saveDeviceChoice } from '@/lib/device-choice';

const key = 'homelibra.sources.sort';

/**
 * Kaynaklar's order and the setter that also keeps it on this device, as
 * Dizin's orders are: Kaynaklar opens in the order it was left in, by Son
 * not the first time.
 */
export function useSourceOrder(): [SourceOrder, (next: SourceOrder) => void] {
  const [order, setOrder] = useState(() => orderOf(loadDeviceChoice(key, storedOrders)));
  const keep = (next: SourceOrder) => {
    setOrder(next);
    saveDeviceChoice(key, storedOrder(next));
  };
  return [order, keep];
}
