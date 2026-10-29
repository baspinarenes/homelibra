# Hicrî ve Rumî tarihlerin Milâdî'ye dönüşümü: kurallar ve TypeScript seçenekleri

- Tarih: 2026-10-29 · Ticket: baspinarenes/homelibra#17 · Besler: #18 (Source ekleme formu ve çok takvimli Tarih girişi prototipi), ADR-0002 (çok takvimli Tarih modeli; #2'nin çözüm yorumunda yazıldığı söylenir, bu dalda dosya yok).
- Durum: araştırma tamamlandı; karar #18'de ve ADR-0002'de kullanılacak. Kaynaklar metin içinde `[S#]` ile işaretli, listesi sondadır. "Deney" ile işaretli bulgular bu makinede 2026-10-29'da çalıştırılan betiklerden (Node v26.3.0, ICU 78.3, CLDR 48) gelir.

## Soru

Tarih alanı üç takvimde (Milâdî, Hicrî, Rumî) ve yıl/ay/gün hassasiyetinde tutulacak; yalnızca sıralama için yaklaşık bir Milâdî karşılığa çevrilecek, bu karşılık ekranda gösterilmeyecek (#2 çözüm yorumu §4 [S42]). Uygulama için yeterli kural seti ve hazır TypeScript/JS seçenekleri neler?

- **Hicrî → Milâdî:** aritmetik (tabular) takvim mi, Umm al-Qura mı; 1200–1340 H aralığında sapma ne kadar; yalnız yıl ya da yıl + ay verilen tarih sıralama için hangi güne çevrilir?
- **Rumî → Milâdî:** 1 Mart yılbaşı, Jülyen kaydırması (yüzyıla göre gün sayısı), 1917 (1332/1333) reformu, 1926'ya kadar yıl numarası; Rumî yıl + Hicrî ay gibi karışık yazımlar ve arşivin yan yana yazdığı Hicrî/Rumî çiftleri.
- **Ay adları ve arşiv kısaltmaları:** girişte tanınacak yazım listesi.
- **Kütüphaneler:** hem web hem React Native'de (Hermes) çalışan, bakımlı paketler; yoksa elle yazılacak formülün güvenilir kaynağı.

## Yöntem

- Birincil kaynak kuralı. Takvim kuralları için Türk Tarih Kurumu'nun çevrimiçi kılavuzu [S1], TDV İslâm Ansiklopedisi'nin "TAKVİM" maddesi [S2], kanun metinlerinin TBMM Kanunlar Dergisi tıpkıbasımları (698, 85 ve 4696 sayılı kanunlar [S6, S7, S8]), Devlet Arşivleri'nin Osmanlı Arşivi Rehberi [S10], TDK sözlüğü [S11] ve hakemli makaleler [S3, S4, S5, S12]. Yazılım tarafında ICU ve CLDR kaynak kodu [S16, S17], ECMA-402 [S18], MDN [S19, S20, S21], Hermes dokümanı ve kaynak kodu [S22–S25], kütüphanelerin kaynak kodu ve npm kayıtları [S27–S40]. Blog yazısı kullanılmadı; Wikipedia yalnızca arama sonucu olarak görüldü, alıntılanmadı.
- Yerel deneyler (betikler geçici dizinde, depoya girmedi):
  1. Reingold–Dershowitz aritmetik Hicrî formülü [S14, S15] TypeScript'te yazıldı ve ICU'nun `islamic-civil` takvimi (`Intl.DateTimeFormat(...).formatToParts`) ile 1200–1340 H arasındaki 1692 ay başının hepsinde karşılaştırıldı; `islamic-tbla`, `islamic-umalqura` ve `islamic` sapmaları aynı aralıkta sayıldı.
  2. Rumî kural seti yazıldı; TDV'nin verdiği kontrol noktaları (1 Mart 1256 = 9 Muharrem 1256, 1 Mart 1287 = 20 Zilhicce 1287, 1 Mart 1288 = 3 Muharrem 1289 [S2]) ve kanun metinlerindeki çift tarihler (26 Kânunuevvel 1341 / 9 Cemâziyelâhir 1344 [S6]; 20 Kânunusani 1337 / 10 Cemâziyelevvel 1339 [S7]; 8 Şubat 1332 / 28 Rebîülâhir 1335 [S4]) ile sınandı.
  3. `@internationalized/date` 3.12.4 ve `temporal-polyfill` 1.0.6 kurulup aynı örneklerle çalıştırıldı; Node 26'nın yerleşik `Temporal`'ı da denendi.
- Sınırlar: TTK'nın çevrimiçi aracına form gönderilmedi (yalnız açıklama metni okundu), bu yüzden TTK sonuçlarıyla birebir karşılaştırma insana bırakıldı. Hermes davranışı cihazda denenmedi; kaynak kodu okunarak çıkarım yapıldı. 1917 kanununun Düstur metni görülmedi; metin Özsaray'ın Takvîmü's-Sinîn'den aktardığı alıntıdan [S3] ve Tezcan Aksu'nun arşiv kaydı (BOA BEO İdare 125/12) verdiği makalesinden [S4] alındı.

## Bulgular

### 1. Hicrî → Milâdî

**Aritmetik (tabular) takvim.** 30 yıllık devirde 11 artık yıl (2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29), tek aylar 30, çift aylar 29 gün, artık yılda Zilhicce 30 gün [S15, S17]. İki epok vardır: *civil* (Cuma, 16 Temmuz 622 Jülyen, JDN 1948440) ve *astronomik/tbla* (Perşembe, 15 Temmuz 622, JDN 1948439); CLDR bunları `islamic-civil` ve `islamic-tbla` olarak adlandırır, `islamicc` eski takma addır [S16, S17]. ICU'nun formülü (ve `@internationalized/date`'in portu [S28]):

```
JDN(y, m, d) = d + ⌈29,5 · (m − 1)⌉ + 354 · (y − 1) + ⌊(3 + 11 · y) / 30⌋ + 1948440 − 1
artık yıl: (14 + 11 · y) mod 30 < 11
```

Deney: bu formül ICU `islamic-civil` ile 1200–1340 H'deki 1692 ay başının hepsinde aynı günü verdi; `islamic-tbla` her zaman bir gün öncedir.

**TTK/Unat uzlaşımı civil epoktur.** TDV'nin verdiği "4 Safer 1088 (8 Nisan 1677)" [S2] ve Özsaray'ın aktardığı "Hicrî 09 Muharrem 1256 ve Rûmî 01 Mart 1256, Milâdî 13 Mart 1840 ... Cuma günü" [S3] civil formülle birebir çıkar (deney); tbla bir gün erken verir. TTK kılavuzu da gözleme değil hesaba dayanır: "Kameri takvimin dayandığı matematiksel ilkelere dayalı bir algoritmayla hesap yapmaktadır" [S1]. Her iki kaynak da Faik Reşit Unat'ın *Hicrî Tarihleri Milâdî Tarihlere Çevirme Kılavuzu*'na (TTK, 1984) dayanır [S2].

**Umm al-Qura bu dönem için tanımsız.** Suudi Arabistan'ın KACST tarafından hesaplanan takvimidir; van Gent'e göre 1392 H (1972) öncesi kuralları belirsiz, 1392–1419, 1420–1422 ve 1423 H sonrası için farklı kurallar geçerlidir [S13]. Yazılımda (ICU, CLDR, MDN) `islamic-umalqura` yalnız 1300–1600 H için tablo içerir, dışında `islamic-civil`'e düşer [S16, S19, S28]. Yani 1200–1299 H için "Umm al-Qura" diye bir şey yoktur (deney: 1200 ay başının hepsinde sapma 0, çünkü aynı formül). 1300–1340 H'de ICU tablosunun civil'den sapması, 492 ay başında: 0 gün 301, −1 gün 154, +1 gün 34, −2 gün 3 (deney). Osmanlı belgeleri için otoritesi olmadığından kullanılmaz.

**Osmanlı resmî takvimi ile aritmetik takvim arasındaki sapma.** TTK: tarihsel uygulamada ay başları rü'yetle belirlendiği için "±2 günlük sapmalar" olabilir, kesinlik için belgedeki gün adı kullanılmalıdır [S1]. Üç kanun metnindeki çift tarihle sınama (deney): 8 Şubat 1332 = 21 Şubat 1917 = 28 Rebîülâhir 1335 [S4] → civil 28 R 1335 = 21 Şubat 1917 (aynı); 20 Kânunusani 1337 = 20 Ocak 1921 = 10 Cemâziyelevvel 1339 [S7] → civil aynı; 26 Kânunuevvel 1341 = 26 Aralık 1925 = 9 Cemâziyelâhir 1344 [S6] → civil 9 C 1344 = 25 Aralık 1925 (bir gün erken). #2'deki "±1 gün" varsayımı [S42] bu örneklemde tutuyor, TTK'nın ±2 uyarısı üst sınır olarak kalmalı. ICU'nun `islamic` takvimi (astronomik simülasyon) ise civil'e göre 0/−1/−2 gün (1692 ay başında 190/1115/387) verir; MDN'ye göre "parametreleri belgelenmemiş, bilinen hiçbir Hicrî takvim varyantıyla eşleşmeyen" bir simülasyondur [S19], kullanılmaz.

**Kısmi tarih → sıralama günü.** Öneri: dönemin **ilk günü**. Yalnız yıl → 1 Muharrem; yıl + ay → ayın 1'i. Gerekçe: deterministik ve açıklanabilir; kısmi tarih kendi alt tarihlerinin hepsinden önce sıralanır (EDTF'de "1985-04" ay hassasiyetinde bütün ayı gösterir, sıralama için başlangıcı almak doğal karşılığıdır [S41]); ayın ortası alınırsa "1310" tarihi Cemâziyelâhir 1310 belgelerinin arasına düşer. Eşitlikte kaba hassasiyet öne gelir ("1310" < "1 M 1310").

### 2. Rumî → Milâdî

Kurallar, kaynaklarıyla:

- **R1 — Tanım.** Malî/Rumî takvim güneş yılına dayanır, Jülyen takvimidir ("Jülyen takviminin Roma kökenli olması sebebiyle ... Türkçe'de Rûmî takvim denildi"), yılbaşı 1 Mart'tır; 1800'lerde 1 Mart Milâdî 13 Mart'a, 1900'lerde 14 Mart'a denk gelir [S2]. Aylar: Mart, Nisan, Mayıs, Haziran, Temmuz, Ağustos, Eylül, Teşrîn-i Evvel, Teşrîn-i Sânî, Kânûn-ı Evvel, Kânûn-ı Sânî, Şubat (31, 30, 31, 30, 31, 31, 30, 31, 30, 31, 31, 28) [S3, S4]. Başlangıcı kaynaklarda farklı anılır: 4 Safer 1088 (8 Nisan 1677) fermanı [S2], I. Mahmud dönemi (1740) [S5], malî belgelerde 1205 H (1790) [S3]; resmî belgelerde "sene-i mâliye" diye geçer [S3].
- **R2 — Yıl sayısı (1256–1332).** Rumî yıl ile Milâdî yıl arasında 584 fark vardır [S3]: Mart–Kânunuevvel için Milâdî yıl = R + 584, Kânunusani–Şubat için R + 585 (yıl Mart'ta başladığından). 1256 malî yılından (1 Mart 1256 = 13 Mart 1840) itibaren sayım kesintisizdir: Takvîmü's-Sinîn "eskiden uğradığı 'sıvış usulü' gibi kesintiye uğramadığından" [S3]; "her 33 yılda bir, 1 yıl düşülmesi 1871 yılından sonra yapılmamış" [S4]. TDV, kurala göre 1288'in sıvış yılı olması gerektiğini ("halbuki mart girişi kuralı uyarınca 1 Mart 1289 olması gerekirdi") yazar [S2]; 1288 malî yılının yaşandığı, 1908–1925 arası resmî çift tarihlerin R + 584 ile tutmasından anlaşılır (deney, [S6, S7]).
- **R3 — Jülyen → Gregoryen kaydırması.** Jülyen 1 Mart 1700 – 28 Şubat 1800: +11 gün; 1 Mart 1800 – 28 Şubat 1900: +12 gün; 1 Mart 1900 – 28 Şubat 1917: +13 gün (deney; Gregoryen 1700, 1800, 1900'ü artık saymaz). Rumî cinsinden: 1 Mart 1316'dan (= 1 Mart 1900 Jülyen = 14 Mart 1900) itibaren 13 gün, 1256–1315 arasında 12 gün [S2]. Şubat'ın uzunluğu Jülyen artık yılına bağlıdır: (R + 585) 4'e bölünüyorsa 29 gün (ör. Şubat 1315 = Şubat 1900 Jülyen, 29 gün; Şubat 1324 = Şubat 1909, 28 gün).
- **R4 — 1917 reformu.** 8 Şubat 1332 (21 Şubat 1917) tarihli "Muamelât-ı Devlette Takvîm-i Garbî'nin Kabulü Hakkında Kanun" [S4; Takvim-i Vekayi 10 Şubat 1332 için S12]: "1332 senesi Şubatının on altıncı (16.) günü 1333 senesi Martının birinci (1.) günü itibâr edilecektir" [S3]. Yani 15 Şubat 1332 = 28 Şubat 1917 son Jülyen gündür, 16–28 Şubat 1332 yoktur (13 gün), 1 Mart 1333 = 1 Mart 1917'dir ve o günden sonra ay/gün Gregoryen ile aynıdır [S3, S4]. 1333 yılı Mart–Kânunuevvel arası on ay sürdü [S3, S4].
- **R5 — Yılbaşı 1 Ocak'a alındı.** 24 Kânunuevvel 1333 tarihli 615 sayılı tamimle "1334 senesi ... Kânûn-i Sânî ibtidâsından ibtidâr" eder; 1 Kânunusani 1334 = 1 Ocak 1918'den itibaren Rumî yıl Kânunusani ile başlar ve Rumî ayların sırası Milâdî aylarla denkleştirilmiştir [S3, S4]. Dolayısıyla 1334–1341 için her ayda Milâdî yıl = R + 584; "Kânunusani 1333" ve "Şubat 1333" diye tarih yoktur. Birincil doğrulama: Teşkilât-ı Esasiye Kanunu "20 kânunusani 1337" tarihli, Ceride-i Resmiye'de "7 şubat 1337"de yayımlandı [S7, S9]; 1337 + 584 = 1921.
- **R6 — Rumî yıl sayımının sonu.** 698 sayılı kanun (26 Kânunuevvel 1341): "1341 senesi kânunuevvelinin 31 nci gününü takib eden gün, 1926 senesi kânunusanisinin birinci günüdür"; Hicrî kamerî takvim "ahvali mahsusada" kullanılmaya devam eder, ayların başını rasathane tespit eder [S6]. 1342 ve sonrası Rumî yıl geçersizdir.
- **R7 — 1256 öncesi (1200–1255).** TDV kuralı: "Malî yılın sayısı da yılbaşısı hangi hicrî yılın içindeyse o yılın sayısıdır"; 33 yılda bir malî yıl "sıvışır" (1255 sıvış yılıdır) [S2]. Bu kural aritmetik Hicrî takvimle uygulanınca (deney): 1222–1254 için Milâdî yıl = R + 585 (Mart–Aralık), 1200–1220 için R + 586; 1221 ve 1255'e malî yıl düşmez. Ancak dönemin belgelerinde yıl sayısının gerçekten böyle yazıldığı doğrulanmadı; Özsaray da Rumî'yi 1205 H (1790) sonrası malî belgelere bağlar [S3]. Uygulamada 1256 öncesi Rumî "yaklaşık" bayrağıyla ve bu kuralla çevrilir, açık soru olarak kalır.

**Karışık yazımlar.**

- *Ay adı takvimi belirler.* Özsaray: belgede "ay yazılı ise tarih türünü tespit etmede bir problem yoktur"; sorun yalnız yılı yazılan tarihlerde çıkar [S3]. Rumî seçili iken Hicrî'ye özgü bir ay (ör. "Ca", "Zilhicce") yazılırsa uygulama takvimi değiştirmeyi önermeli; tersi de aynı. Hicrî ay adı + Rumî yıl sayısı geçerli bir tarih değildir; kullanıcı yılın takvimini onaylar, onaylamazsa tarih yıl hassasiyetinde kaydedilir, ay Künye notu'na yazılır (öneri).
- *Yan yana yazılan Hicrî/Rumî çiftleri.* "Resmi kâğıtlarda ikisi birden kullanıldığı" bilinir [S3]; BOA'nın Rumî esaslı tasnif ettiği fonlarda gömlek üzerinde Rumî kısaltmalar kullanılır [S3, dn. 39]. Tarih alanı tek takvim taşıdığından (#2 §4) öneri: belgenin kendi tarihi (çoğu belgede Hicrî) Tarih'e, diğeri Künye notu'na ya da Locator metnine; iki tarihin türetilmiş Milâdî karşılıkları ±2 gün içinde değilse formda uyarı (tutarlılık denetimi, öneri).
- *Yalnız yıl verilen tarihin takvimi.* Özsaray'ın ölçütleri: 1205 H öncesi yıllar Hicrî'dir; sonrasında vergi/bütçe/tahsilat gibi malî içerik Rumî'ye, diğer içerik Hicrî'ye işaret eder; 1905 (R. 1321) nüfus sayımı sonrası nüfus evrakı Rumî; 1 Ocak 1926 sonrası Milâdî [S3]. Bunlar kullanıcıya ipucu olabilir, uygulama kendi karar vermemelidir.

### 3. Ay adları ve girişte tanınacak kısaltmalar

Hicrî kısaltmalar Devlet Arşivleri'nin rehberinden (s. VII "Kısaltmalar") [S10]; tam adlar TDV'den [S2]. Rumî kısaltmalar rehberden [S10] ve Özsaray'ın tablosundan (noktalı biçim) [S3]; bugünkü karşılıklar 4696 sayılı kanun ("Teşrinievvel ayı Ekim, Teşrinisani ayı Kasım, Kânunuevvel ayı Aralık ve Kânunusani ayı da Ocak olarak değiştirilmiştir", 10.1.1945) [S8] ve TDK [S11].

| # | Hicrî ay | BOA kısaltması [S10] | Tanınacak yazım çeşitleri (öneri) |
|---|---|---|---|
| 1 | Muharrem | M. | muharrem |
| 2 | Safer | S. | safer |
| 3 | Rebîülevvel | Ra. | rebiulevvel, rebiülevvel, rebi'ül-evvel |
| 4 | Rebîülâhir | R. | rebiulahir, rebiülahir, rebiussani, rebiülsani |
| 5 | Cemâziyelevvel | Ca. | cemaziyelevvel, cemaziyülevvel, cemaziye'l-evvel |
| 6 | Cemâziyelâhir | C. | cemaziyelahir, cemaziyessani, cemaziyelsani |
| 7 | Receb | B. | receb, recep |
| 8 | Şâban | Ş. | şaban, saban |
| 9 | Ramazan | N. | ramazan |
| 10 | Şevval | L. | şevval, sevval |
| 11 | Zilkade | Za. | zilkade, zülkade, zilka'de |
| 12 | Zilhicce | Z. | zilhicce, zülhicce |

Rehber ayrıca ayın on günlük dilimleri için El. (Evâil), Et. (Evâsıt), Er. (Evâhir) kısaltmalarını verir [S10]; #2 kararı bunları modellemez, ay hassasiyetinde girilip Künye notu'na yazılır [S42]. Girişte tanınıp bu dönüşüm otomatik önerilebilir (öneri).

| # | Rumî ay | BOA kısaltması [S10] | Özsaray rumuzu [S3] | Bugünkü ad [S8, S11] | Gün |
|---|---|---|---|---|---|
| 1 | Mart | Ma | Ma. | Mart | 31 |
| 2 | Nisan | Ni | Ni. | Nisan | 30 |
| 3 | Mayıs | My | My. | Mayıs | 31 |
| 4 | Haziran | H | H. | Haziran | 30 |
| 5 | Temmuz | T | T. | Temmuz | 31 |
| 6 | Ağustos | A | A. | Ağustos | 31 |
| 7 | Eylül | E | E. | Eylül | 30 |
| 8 | Teşrîn-i Evvel (Teşrinievvel) | Te | Te. | Ekim | 31 |
| 9 | Teşrîn-i Sânî (Teşrinisani) | Ts | Ts. | Kasım | 30 |
| 10 | Kânûn-ı Evvel (Kânunuevvel) | Ke | Ke. | Aralık | 31 |
| 11 | Kânûn-ı Sânî (Kânunusani) | Ks | Ks. | Ocak | 31 |
| 12 | Şubat | Şu | Şu. | Şubat | 28/29 (R3) |

Eşleme için normalizasyon (öneri): küçük harf (İ→i), şapka ve uzatma işaretlerini kaldır (â→a, î→i, û→u), kesme, tire, nokta ve boşlukları at ("Teşrîn-i Evvel" → `tesrinievvel`, "Kânûn-ı Sânî" → `kanunisani`), sonra takvime göre tabloya bak. Bugünkü adlar (ekim, kasım, aralık, ocak) Rumî takviminde de kabul edilir. Tek harfli kısaltmalar takvimler arasında çakışır (M Muharrem / Ma Mart; S Safer / Ş Şâban / Şu Şubat; H Haziran; N Ramazan / Ni Nisan): seçili takvim belirleyicidir; yalnız öteki takvime ait bir kısaltma yazılmışsa takvim değişikliği önerilir.

### 4. Örnek dönüşüm tablosu

Hicrî satırlar aritmetik civil takvimle (deney); parantezde ICU `islamic-tbla` ve `islamic-umalqura` (1300 H öncesi civil'e eşit). Rumî satırlar R1–R7 ile. Gün adları deneyden.

| Girilen tarih | Takvim | Sıralama günü (Milâdî) | Not |
|---|---|---|---|
| 29 Z 1310 | Hicrî | 14 Temmuz 1893, Cuma | tbla 13 Tem; umalqura 13 Tem |
| 15 Ca 1325 | Hicrî | 26 Haziran 1907, Çarşamba | tbla 25 Haz; umalqura 26 Haz |
| 1310 (yalnız yıl) | Hicrî | 26 Temmuz 1892 | 1 Muharrem 1310 |
| Z 1310 (yıl + ay) | Hicrî | 16 Haziran 1893 | 1 Zilhicce 1310 |
| 1325 (yalnız yıl) | Hicrî | 14 Şubat 1907 | 1 Muharrem 1325 |
| Ca 1325 (yıl + ay) | Hicrî | 12 Haziran 1907 | 1 Cemâziyelevvel 1325 |
| 4 S 1088 | Hicrî | 8 Nisan 1677 | TDV ile aynı [S2] |
| 28 R 1335 | Hicrî | 21 Şubat 1917 | 1917 kanununun tarihi, resmî çift tarihle aynı [S4] |
| 9 C 1344 | Hicrî | 25 Aralık 1925 | resmî: 26 Aralık 1925 [S6], civil 1 gün erken |
| 1 M 1300 | Hicrî | 12 Kasım 1882 | ICU Umm al-Qura tablosunun başı [S19] |
| 1 Teşrinievvel 1324 | Rumî | 14 Ekim 1908, Çarşamba | Jülyen, R+584, +13 gün |
| 14 Mart 1331 | Rumî | 27 Mart 1915, Cumartesi | Jülyen, +13 gün |
| 10 Temmuz 1324 | Rumî | 23 Temmuz 1908 | Jülyen |
| 1 Kânunusani 1324 | Rumî | 14 Ocak 1909 | Kânunusani → R+585 |
| 1 Mart 1256 | Rumî | 13 Mart 1840, Cuma | Takvîmü's-Sinîn'in başlangıcı, "Cuma günü" [S3] |
| 1 Mart 1288 | Rumî | 13 Mart 1872 | sıvış uygulanmadı [S4] |
| 1 Mart 1250 | Rumî | 13 Mart 1835 | R7, +585 (çıkarım, yaklaşık bayrağı) |
| 15 Şubat 1332 | Rumî | 28 Şubat 1917 | son Jülyen gün [S3] |
| 20 Şubat 1332 | Rumî | geçersiz | 16–28 Şubat 1332 atlandı [S3, S4] |
| 1 Mart 1333 | Rumî | 1 Mart 1917 | Gregoryen ay/gün başlar |
| 5 Kânunusani 1333 | Rumî | geçersiz | 1333 on ay sürdü; 1 Kânunusani 1334 = 1 Ocak 1918 [S3, S4] |
| 20 Kânunusani 1337 | Rumî | 20 Ocak 1921 | Teşkilât-ı Esasiye Kanunu [S7, S9] |
| 26 Kânunuevvel 1341 | Rumî | 26 Aralık 1925 | 698 sayılı kanun [S6] |
| 1 Kânunusani 1342 | Rumî | geçersiz | 1 Ocak 1926 Milâdî'dir [S6] |
| 1324 (yalnız yıl) | Rumî | 14 Mart 1908 | 1 Mart 1324 |
| Teşrinievvel 1324 (yıl + ay) | Rumî | 14 Ekim 1908 | 1 Teşrinievvel 1324 |
| 1333 (yalnız yıl) | Rumî | 1 Mart 1917 | yıl Mart'ta başladı |
| 1336 (yalnız yıl) | Rumî | 1 Ocak 1920 | 1334'ten itibaren yıl 1 Kânunusani'de başlar (R5) |

### 5. Kütüphane karşılaştırması

| Seçenek | Sürüm / son yayın | Lisans | Algoritma ve veri | Hicrî→Milâdî | Rumî | Web + React Native (Hermes) | Değerlendirme |
|---|---|---|---|---|---|---|---|
| `Intl.DateTimeFormat` `calendar: islamic-civil / islamic-tbla / islamic-umalqura` | ECMA-402; `calendar` seçeneği Baseline 2017 [S20] | — | motorun ICU/CLDR verisi; umalqura 1300–1600 H, dışında civil [S19] | Yok: "it does not provide any parsing facilities" [S18]; yalnız Milâdî→Hicrî biçimler; ters yön için gün tarama gerekir (deney) | yok | Hermes `calendar` seçeneğini Android'de `android.icu` takvimine (API 24+), iOS'ta `NSCalendar`'a geçirir [S23, S24]; veri cihazın işletim sistemine bağlı, sürümler arası farklılık kabul edilmiş [S22]; `Intl.supportedValuesOf` ve `Intl.Locale` yok (ECMA-402 7. baskı hedefi) [S22, S25] | dönüşüm motoru olarak uygun değil |
| `Temporal` (yerleşik) | MDN: "Limited availability" [S21]; Node 26'da var (deney) | — | motorun ICU'su | `PlainDate.from({calendar, year, month, day}).withCalendar('iso8601')` doğru sonuç verdi (deney) | yok | Hermes'te yok | henüz değil |
| `temporal-polyfill` | 1.0.6, 2026-10-13 [S30] | MIT | `/full/` girişinde `islamic-civil`, `islamic-tbla`, `islamic-umalqura`; 19,5 kB; test262 "near-perfect" [S30] | örneklerde ICU ile aynı (deney); geçersiz gün (30 Safer) RangeError | yok | Tarayıcı alt sınırları `Intl.DateTimeFormat` takvim desteğine bağlı (Chrome 67/80, Safari 14/14.1) [S30]; Node ≥ 16; ESM-only; Hermes anılmıyor | takvim verisi için motor Intl'ine dayandığı anlaşılıyor (çıkarım); Hermes'te doğrulanmadı |
| `@js-temporal/polyfill` | 0.5.1, 2025-03 [S31] | ISC | referans polyfill | — | yok | "ready for production use when the Temporal proposal reaches Stage 4" [S31] | üretim için değil |
| `@internationalized/date` (Adobe React Spectrum) | 3.12.4, 2026-09-01; 1208 sürüm [S29] | Apache-2.0 | ICU'nun saf JS portu: civil/tbla formülü, umalqura 1300–1600 tablosu, dışında civil [S28]; tek bağımlılık `@swc/helpers` | `toCalendar(new CalendarDate(new IslamicCivilCalendar(), y, m, d), new GregorianCalendar())` örneklerin hepsinde ICU ile aynı (deney) | yok (Jülyen takvimi de yok) | Takvim sınıfları `Intl` kullanmaz; `Intl.DateTimeFormat` saat dilimi dönüşümünde, `Intl.Locale` hafta sorgularında kullanılır (dist incelemesi) — Hermes'te bu fonksiyonlardan uzak durulmalı | uygun; dikkat: geçersiz gün/ay sessizce kırpılır (30 Safer → 29, 13. ay → 12; deney) |
| `hijri-date` | 0.2.2, 2017-01 [S32] | MIT | README'de algoritma belirtilmiyor; TS tipi yok | var | yok | — | bakımsız |
| `moment-hijri` | 3.0.0, 2024-10 [S33] | MIT | Umm al-Qura tablosu 1356–1500 H ("hy: Hijri year (1356 to 1500)") [S33]; `moment` bağımlılığı | 1356 H öncesi yok | yok | — | Osmanlı aralığını kapsamaz |
| `hijri-converter` | 1.1.1, 2018-10 [S34] | MIT | "Um Alqura"; aralık belirtilmemiş; TS tipi yok | ? | yok | — | bakımsız |
| `@tabby_ai/hijri-converter` | 1.0.5, 2023-08 [S35] | MIT | Python hijri-converter portu, Umm al-Qura, "1343–1500 AH" [S35] | 1343 H öncesi yok | yok | — | kapsamaz |
| `hijri-core` / `luxon-hijri` | 1.1.0 / 3.0.3, 2026 [S36] | MIT | KACST Umm al-Qura tablosu "1318–1500 AH" + FCNA [S36] | 1318 H öncesi yok | yok | — | yeni, kapsamaz |
| `intl-date` | 1.0.0, 2026-09 [S37] | Apache-2.0 | `islamic-umalqura`, `islamic-civil`, `islamic-tbla` | var (denenmedi) | yok | — | çok yeni, tek sürüm |
| `@umalqura/core` | 0.0.7, 2019-07 [S38] | MIT | Umm al-Qura | — | yok | — | bakımsız |
| `date-fns-jalali` | 4.4.0-0 [S39] | MIT | Farsça (Celâlî) | yok | yok | — | konu dışı; npm'de date-fns tarzı Hicrî port bulunamadı [S40] |
| Rumî için paket | — | — | npm aramasında ("rumi takvim", "rumi") ilgili paket yok [S40]; CLDR'de Rumî takvim tanımı yok [S17] | — | — | — | elle yazılacak |

Güvenilir formül kaynağı: Reingold & Dershowitz, *Calendrical Calculations*, 4. baskı [S14]; Reingold'un GNU Emacs `cal-islam.el` uygulaması (epok 16 Temmuz 622 Jülyen, artık yıllar 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29) [S15]; aynı formül ICU `islamcal.cpp`'de [S16]. Rumî için kaynak TDV [S2], Özsaray [S3], Tezcan Aksu [S4] ve kanun metinleri [S6, S7]; TTK'nın çevrimiçi aracı Rumî için "böyle bir sorun söz konusu değildir" der [S1].

## Öneri

1. **Kendimiz yazarız: bağımlılıksız bir `takvim` alan modülü (yaklaşık 120 satır TypeScript).** Jülyen gün numarası (JDN) üzerinden üç yardımcı: `gregoryen↔JDN`, `jülyen→JDN`, `hicrî→JDN` (civil epok formülü, §1) ve `rumî→JDN` (R1–R7). Rumî için zaten kütüphane yok; Hicrî formülü tek satır ve ICU ile 1692 ay başında birebir doğrulandı (deney). Böylece dönüşüm Hermes'in Intl'inden ve cihazın işletim sistemi verisinden bağımsız, web ve native'de aynı sonucu verir. Bu rapordaki tablo (§4) ve "ICU `islamic-civil` ile 1200–1340 H ay başları" karşılaştırması birim testi olur (Node'da `Intl` var). Yedek seçenek: `@internationalized/date`'in `IslamicCivilCalendar` + `toCalendar`'ı (Apache-2.0, bakımlı, aynı algoritma); form bileşenleri React Aria'dan gelecekse Hicrî tarafını ona devretmek makul, ama geçersiz gün kırpması nedeniyle doğrulama yine bizde kalır.
2. **Hicrî kuralı:** aritmetik civil takvim (Cuma epoku), TTK/Unat ve TDV ile aynı uzlaşım; Umm al-Qura ve ICU `islamic` kullanılmaz. Milâdî karşılık formda "≈" ile ipucu olarak gösterilir (±1 gün tipik, ±2 olabilir [S1]); Rumî karşılık kesindir, "≈" gerekmez.
3. **Rumî kuralı:** R1–R7. Kabul edilen yıl aralığı 1200–1341; 1256 öncesi "yaklaşık" bayrağı. Geçersiz sayılan girişler: 16–28 Şubat 1332; Kânunusani/Şubat 1333; 1342 ve sonrası; ay uzunluğunu aşan gün (Şubat için R3'teki artık kuralı; 1334–1341'de Gregoryen artık kuralı).
4. **Kısmi tarih:** dönemin ilk günü (1 Muharrem; ayın 1'i; Rumî yıl için 1 Mart, 1334–1341 için 1 Kânunusani). Sıralama anahtarı: JDN (tam sayı) + hassasiyet derecesi (yıl < ay < gün) eşitlik kırıcı. Çevrilemeyen/geçersiz tarih Locator'daki sıralanamayan konumlar gibi listenin sonuna düşer.
5. **Giriş tanıma:** §3 tabloları + normalizasyon; ay adı seçili takvimle uyuşmuyorsa takvim değişikliği önerisi; Evâil/Evâsıt/Evâhir tanınır, ay hassasiyetine indirilir ve Künye notu önerilir; yalnız yıl girişinde takvim seçimi zorunlu (uygulama Hicrî/Rumî tahmini yapmaz, Özsaray'ın ölçütleri yardım metni olabilir [S3]).
6. **Doğrulama tutarlılığı:** aynı Source'ta Hicrî ve Rumî çift tarih varsa (biri Tarih'te, diğeri Künye notu'nda) prototipte göstermek yeterli; otomatik tutarlılık denetimi (±2 gün) ileriye bırakılabilir.

## Açık sorular

- TTK'nın çevrimiçi aracıyla birebir karşılaştırma yapılmadı (form gönderilmedi). İnsan için 10 dakikalık iş: §4'teki Hicrî satırları TTK aracına girip civil sonuçlarla karşılaştırmak; farklıysa TTK'nın hangi uzlaşımı kullandığı not edilmeli.
- 1256 öncesi Rumî yıl numaralandırması (R7) yalnız TDV kuralından türetildi; dönemin belgeleriyle doğrulanmadı. Uygulama bu aralığı hiç kabul etmeyebilir ya da "yaklaşık" bayrağıyla kabul eder; karar insanın.
- TDV, kurala göre bir sonraki sıvış yılını 1321 olarak verir [S2]; aritmetik hesapta 1 Mart içermeyen Hicrî yıl 1322 çıkıyor (deney). Uygulamayı etkilemez (sıvış 1871 sonrası yapılmadı [S4]), ama kaynak farkı kayda değer.
- 1917 kanununun numarası ikincil kaynaklarda tutarsız (125 ve 2851 aynı makalede [S4]); Düstur metni görülmedi. Kural (16 Şubat 1332 = 1 Mart 1333) iki bağımsız makalede aynı [S3, S4].
- Hermes'te `Intl.DateTimeFormat` ile Hicrî biçimleme cihazda denenmedi; yalnız gösterim için bile kullanılacaksa Android API 24+ ve iOS'ta `islamic-civil` takvim adlarının kabulü test edilmeli (öneri gereği dönüşümde kullanılmıyor).
- Milâdî seçili iken 1917 öncesi Jülyen tarihli yabancı belgeler (ör. Rus kaynakları) modellenmiyor; #2 "Jülyen ayrı seçenek değil" dedi [S42]. İhtiyaç çıkarsa Rumî kodundaki Jülyen→Gregoryen yardımcı yeniden kullanılabilir.
- Evâil/Evâsıt/Evâhir için sıralama günü: ay hassasiyetine indirgeme (ayın 1'i) ile 1/11/21 eşlemesi arasında seçim; ADR-0002 bunları modellemediği için şimdilik ayın 1'i.
- `@internationalized/date` tercih edilirse geçersiz tarihlerin sessizce kırpılması ve Hermes'te `Intl.Locale` kullanan fonksiyonların durumu kabul edilmiş riskler olur.

## Kaynaklar

- [S1] Türk Tarih Kurumu — Tarih Çevirme Kılavuzu (çevrimiçi araç ve açıklama metni): https://www.ttk.gov.tr/tarih-cevirme-kilavuzu/
- [S2] TDV İslâm Ansiklopedisi — "TAKVİM" (A. Necati Akgür, c. 39, İstanbul 2010, s. 487–490): https://islamansiklopedisi.org.tr/takvim
- [S3] Özsaray, Mustafa — "Osmanlı Belgelerinde Kullanılan Tarih Türleri" (DergiPark, 2019, c. 1, sy. 1, s. 28–40; makale dosyası 910161): https://dergipark.org.tr/tr/download/article-file/910161
- [S4] Tezcan Aksu, Belgin — "Sekizinci Yüzyıldan Günümüze Takvimlerimiz" (DergiPark, makale dosyası 490546): https://dergipark.org.tr/en/download/article-file/490546
- [S5] Bulut, Mehmet — "Türkiye Büyük Millet Meclisi'nde Takvimler ve 'Ru'yet-i Hilâl' Üzerine Bir Müzakere" (DergiPark, makale dosyası 410422): https://dergipark.org.tr/en/download/article-file/410422
- [S6] TBMM Kanunlar Dergisi — 698 sayılı "Takvimde tarih mebdeinin tebdili hakkında kanun" (26 Kânunuevvel 1341 / 9 Cemâziyelâhir 1344; Resmî Ceride 2.1.1926, sayı 260): https://www5.tbmm.gov.tr/tutanaklar/KANUNLAR_KARARLAR/kanuntbmmc004/kanuntbmmc004/kanuntbmmc00400698.pdf
- [S7] TBMM Kanunlar Dergisi — 85 sayılı Teşkilâtı Esasiye Kanunu (20 Kânunusani 1337 / 10 Cemâziyelevvel 1339; Ceride-i Resmiye 7 Şubat 1337, No. 1): https://www5.tbmm.gov.tr/tutanaklar/KANUNLAR_KARARLAR/kanuntbmmc001/kanuntbmmc001/kanuntbmmc00100085.pdf
- [S8] TBMM Kanunlar Dergisi — 4696 sayılı "Bazı ay adlarının değiştirilmesi hakkında kanun" (10.1.1945; Resmî Gazete 15.1.1945, sayı 5905): https://www5.tbmm.gov.tr/tutanaklar/KANUNLAR_KARARLAR/kanuntbmmc027/kanuntbmmc027/kanuntbmmc02704696.pdf
- [S9] Anayasa Mahkemesi — 1921 Anayasası (Kanun No 85, Kabul Tarihi 20/1/1337): https://www.anayasa.gov.tr/tr/mevzuat/onceki-anayasalar/1921-anayasasi/
- [S10] T.C. Başbakanlık Devlet Arşivleri Genel Müdürlüğü — Başbakanlık Osmanlı Arşivi Rehberi, 4. baskı, İstanbul 2017 (Yayın Nu 147), "Kısaltmalar" s. VII: https://www.devletarsivleri.gov.tr/cdn?fileId=173
- [S11] TDK Güncel Türkçe Sözlük — teşrinievvel, teşrinisani, kânunuevvel, kânunusani maddeleri: https://sozluk.gov.tr/
- [S12] Georgeon, François — "Changes of Time: An Aspect of Ottoman Modernization", New Perspectives on Turkey 44 (2011), 181–195, DOI 10.1017/S0896634600005987 (kaynakçasında Takvim-i Vekayi 10 Şubat 1332): https://www.cambridge.org/core/journals/new-perspectives-on-turkey/article/abs/changes-of-time-an-aspect-of-ottoman-modernization/5F267C17F38712BDCCA4360A59E54334
- [S13] van Gent, R.H. (Utrecht Üniversitesi) — The Umm al-Qura Calendar of Saudi Arabia (giriş ve "astronomical rules" sayfaları): https://webspace.science.uu.nl/~gent0113/islam/ummalqura.htm
- [S14] Reingold, E. M. & Dershowitz, N. — Calendrical Calculations, 4. baskı (kitap sayfası, Calendrica kodu): https://www.cs.tau.ac.il/~nachum/calendar-book/index.shtml
- [S15] GNU Emacs kaynak — `lisp/calendar/cal-islam.el` (Reingold; epok 16 Temmuz 622 Jülyen, artık yıl listesi): https://github.com/emacs-mirror/emacs/blob/master/lisp/calendar/cal-islam.el
- [S16] ICU kaynak — `icu4c/source/i18n/islamcal.cpp` (CIVIL_EPOC 1948440, ASTRONOMICAL_EPOC 1948439, UMALQURA_YEAR_START/END 1300/1600, civilLeapYear): https://github.com/unicode-org/icu/blob/main/icu4c/source/i18n/islamcal.cpp
- [S17] Unicode CLDR — `common/bcp47/calendar.xml` (islamic, islamic-civil, islamic-tbla, islamic-umalqura, islamic-rgsa; islamicc takma adı): https://github.com/unicode-org/cldr/blob/main/common/bcp47/calendar.xml
- [S18] ECMA-402 — ECMAScript Internationalization API Specification (§4.2 "does not provide any parsing facilities"; DateTimeFormat): https://tc39.es/ecma402/#datetimeformat-objects
- [S19] MDN — `Intl.supportedValuesOf()` (desteklenen takvim türleri; islamic-umalqura 1300–1600 H, islamic "astronomical simulation"): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf
- [S20] MDN — `Intl.DateTimeFormat()` yapıcısı (`calendar` seçeneği): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
- [S21] MDN — Temporal ("Limited availability"): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
- [S22] Hermes — `doc/IntlAPIs.md` (ECMA-402 7. baskı hedefi, platform Intl'i, sınırlamalar): https://github.com/facebook/hermes/blob/main/doc/IntlAPIs.md
- [S23] Hermes kaynak — `lib/Platform/Intl/java/com/facebook/hermes/intl/DateTimeFormat.java` ve `PlatformDateTimeFormatterICU.java` (`calendar` → `ca` uzantısı → `android.icu.util.Calendar`): https://github.com/facebook/hermes/tree/main/lib/Platform/Intl/java/com/facebook/hermes/intl
- [S24] Hermes kaynak — `lib/Platform/Intl/PlatformIntlApple.mm` (`NSCalendar initWithCalendarIdentifier`): https://github.com/facebook/hermes/blob/main/lib/Platform/Intl/PlatformIntlApple.mm
- [S25] Hermes kaynak — `lib/VM/JSLib/Intl.cpp` (Collator, DateTimeFormat, NumberFormat, getCanonicalLocales; supportedValuesOf ve Locale yok): https://github.com/facebook/hermes/blob/main/lib/VM/JSLib/Intl.cpp
- [S26] React Native — Using Hermes (varsayılan motor): https://reactnative.dev/docs/hermes
- [S27] @internationalized/date — Calendar dokümantasyonu: https://react-aria.adobe.com/internationalized/date/Calendar
- [S28] @internationalized/date kaynak — `src/calendars/IslamicCalendar.ts` (ICU portu, epoklar, 1300–1600 tablosu): https://github.com/adobe/react-spectrum/blob/main/packages/%40internationalized/date/src/calendars/IslamicCalendar.ts
- [S29] npm — @internationalized/date: https://www.npmjs.com/package/@internationalized/date
- [S30] temporal-polyfill — README ve npm (1.0.6; `/full/` takvimler; tarayıcı tablosu): https://github.com/fullcalendar/temporal-polyfill · https://www.npmjs.com/package/temporal-polyfill
- [S31] @js-temporal/polyfill — README: https://github.com/js-temporal/temporal-polyfill
- [S32] npm — hijri-date: https://www.npmjs.com/package/hijri-date
- [S33] moment-hijri kaynak (Umm al-Qura tablosu 1356–1500) ve npm: https://github.com/xsoh/moment-hijri/blob/master/moment-hijri.js · https://www.npmjs.com/package/moment-hijri
- [S34] npm — hijri-converter: https://www.npmjs.com/package/hijri-converter
- [S35] npm — @tabby_ai/hijri-converter (1343–1500 AH): https://www.npmjs.com/package/@tabby_ai/hijri-converter
- [S36] npm — hijri-core ve luxon-hijri (Umm al-Qura 1318–1500 AH): https://www.npmjs.com/package/hijri-core · https://www.npmjs.com/package/luxon-hijri
- [S37] npm — intl-date: https://www.npmjs.com/package/intl-date
- [S38] npm — @umalqura/core: https://www.npmjs.com/package/@umalqura/core
- [S39] npm — date-fns-jalali: https://www.npmjs.com/package/date-fns-jalali
- [S40] npm registry araması ("hijri", "rumi takvim", "umalqura"; 2026-10-29): https://registry.npmjs.org/-/v1/search?text=hijri
- [S41] Library of Congress — Extended Date/Time Format (EDTF), indirgenmiş hassasiyet: https://www.loc.gov/standards/datetime/
- [S42] baspinarenes/homelibra#2 çözüm yorumu, §4 "Tarih: tipli ve takvimli": https://github.com/baspinarenes/homelibra/issues/2
