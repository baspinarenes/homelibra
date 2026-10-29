import { describe, expect, it } from 'vitest';

import { compareTr } from './index';

describe('compareTr', () => {
  it('orders by the Turkish alphabet', () => {
    const titles = ['Osmanlı', 'Ilgaz', 'Çanakkale', 'İzmir', 'Cevdet', 'Öncü', 'Divan', 'Şam', 'Sultan'];
    expect([...titles].sort(compareTr)).toEqual([
      'Cevdet',
      'Çanakkale',
      'Divan',
      'Ilgaz',
      'İzmir',
      'Osmanlı',
      'Öncü',
      'Sultan',
      'Şam',
    ]);
  });

  it('puts dotless ı before dotted i', () => {
    expect(['inci', 'ırmak'].sort(compareTr)).toEqual(['ırmak', 'inci']);
  });
});
