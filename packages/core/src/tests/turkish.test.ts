import { describe, expect, it } from 'vitest';

import { compareTr, titleCaseTr } from '../index';

describe('titleCaseTr', () => {
  it.each([
    ['Basım tarihi', 'Basım Tarihi'],
    ['ilk baskı tarihi', 'İlk Baskı Tarihi'],
    ['ırmak adı', 'Irmak Adı'],
  ])('starts each word of %j with a Turkish capital', (text, title) => {
    expect(titleCaseTr(text)).toBe(title);
  });

  it.each([
    ['filtrele ve sırala', 'Filtrele ve Sırala'],
    ['kitap veya makale', 'Kitap veya Makale'],
    ['e-posta ile giriş', 'E-posta ile Giriş'],
    ['başlık ya da yazar', 'Başlık ya da Yazar'],
    ['ve sonrası', 'Ve Sonrası'],
  ])('keeps the conjunctions of %j lower-case, unless first', (text, title) => {
    expect(titleCaseTr(text)).toBe(title);
  });

  it.each([
    ['ISBN önerisi', 'ISBN Önerisi'],
    ['Hicrî tarih', 'Hicrî Tarih'],
    ['Belge / defter tarihi', 'Belge / Defter Tarihi'],
  ])('changes only the first letters of %j', (text, title) => {
    expect(titleCaseTr(text)).toBe(title);
  });
});

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
