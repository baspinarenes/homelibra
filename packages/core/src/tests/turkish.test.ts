import { describe, expect, it } from 'vitest';

import { ablativeTr, compareTr, titleCaseTr } from '../index';

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

describe('ablativeTr', () => {
  it.each([
    ['s. 52', "s. 52'den"],
    ['s. 53', "s. 53'ten"],
    ['s. 56', "s. 56'dan"],
    ['s. 60', "s. 60'tan"],
    ['s. 10', "s. 10'dan"],
    ['s. 20', "s. 20'den"],
    ['s. 40', "s. 40'tan"],
    ['s. 70', "s. 70'ten"],
    ['s. 100', "s. 100'den"],
    ['s. 2000', "s. 2000'den"],
    ['s. 52–54', "s. 52–54'ten"],
    ['12:34', "12:34'ten"],
    ['12:00', "12:00'den"],
  ])('reads the number at the end of %j as it is said', (locator, from) => {
    expect(ablativeTr(locator)).toBe(from);
  });

  it.each([
    ['vr. 12a', "vr. 12a'dan"],
    ['vr. 12b', "vr. 12b'den"],
    ['vr. 12r', "vr. 12r'den"],
    ['vr. 12v', "vr. 12v'den"],
  ])('says a folio side %j by its letter', (locator, from) => {
    expect(ablativeTr(locator)).toBe(from);
  });

  it.each([
    ['Önsöz', "Önsöz'den"],
    ['Giriş', "Giriş'ten"],
    ['Arka kapak', "Arka kapak'tan"],
    ['Kronoloji', "Kronoloji'den"],
    ['Mukaddime', "Mukaddime'den"],
  ])('follows the vowels and the last sound of the word %j', (locator, from) => {
    expect(ablativeTr(locator)).toBe(from);
  });
});
