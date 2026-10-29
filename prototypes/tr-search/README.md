# PROTOTYPE: Türkçe arama yapılandırması (#28)

Atılacak kod. Soru: [Türkçe arama sözleşmesi](https://github.com/baspinarenes/homelibra/issues/16)'nin senaryo tablosunu baştan sona geçen bir PostgreSQL FTS kurulumu var mı? Cevap ve karar [#28](https://github.com/baspinarenes/homelibra/issues/28)'de.

```bash
./run.sh
```

Docker gerekir. `postgres:17` imajından `search.sql`'i init betiği olarak taşıyan bir imaj kurar, `scenarios.sql`'i koşar, sonuç tablosunu basar ve konteyneri siler.

## Dosyalar

- `search.sql`: kurulumun tamamı (normalizasyon fonksiyonları, `notes`/`sources` şeması, generated `tsvector`, GIN ve trigram indeksleri, sorgu ayrıştırma, iki arama fonksiyonu). `infra/postgres` imajının arama kısmı buna karşılık gelir.
- `scenarios.sql`: #16'nın senaryo tablosu (sözleşme, değiştirilmez), ek kontroller (E) ve sıralama kontrolleri (S).
- `Dockerfile`, `run.sh`: koşturucu.

## Kurulum

Postgres'in sözlük zinciri kök bulucudan sonra filtre çalıştıramıyor. Bu yüzden sıra (Türkçe küçültme → kök bulma → katlama) SQL fonksiyonlarında. Hem `tsvector` hem sorgu aynı fonksiyonlardan geçer; istemci tarafında normalizasyon yok. `$SHAREDIR`'e özel dosya, C eklentisi ya da `postgres:17` dışında paket gerekmiyor: `unaccent`, `pg_trgm` ve yerleşik `turkish_stem` yetiyor.

1. **Küçültme** (`hl_lower`): NFC, `I → ı`, `İ → i`, sonra libc `lower`. Hazır biçimi olmayan birleşik işaretler silinir.
2. **Bölme** (`hl_split`): harf/rakam dizileri. Kesme işaretleri (ʿ ʾ ' ’) kelimeyi bölmez. Tireli bileşik parçalarına ayrılır; bitişik hâli de ilk ve son parçanın konumuna yazılır.
3. **Üç ad alanı**, aynı konumda:
   - `=kır`: ham (küçültülmüş, katlanmamış). Birebir kademe içinde yazımı da tutanı üste çıkarır.
   - `kir`: katlanmış (`unaccent` + kelime sonu b/d → p/t). Birebir ve önek (`'kir':*`, 3+ harf) eşleşmeleri buradan.
   - `~kir`: kök kümesi. Kelimenin kendisi ve düzeltilmiş kök adayları, katlanmış hâlde. Sorgu kelimesinin kök kümesiyle kesişirse kök eşleşmesi.
4. **Kök bulma**, Türkçe harfler duruyorken: `turkish_stem` transkripsiyon işaretleri silinmiş (ama ç ğ ı ö ş ü korunmuş) kelimeye uygulanır. Çıktısı üç kuralla düzeltilir:
   - **R1:** ünlüyle biten köke eklenmiş tek ünsüz (-m, -n) iyelik eki sayılmaz. Böylece kadın ≠ kadı+n; yangın, ferman ve İslam da korunur. Kök bulucu n/m'yi daha uzun bir kelimeden kesmişse n/m'li hâl de aday olur: fermanı → ferman, kadının → kadı ve kadın.
   - **R2:** kelimenin başı olmayan kök atılır (son ünsüz yumuşaması hariç). Kök bulucu d'den sonra ünlü ekliyor: kadim → kadı, Mehmed → mehmedi.
   - **R3:** ünlü düşmesi geri alınır: vakfı → vakıf, hükmü → hüküm, emri → emir.
   - Kesmeden önceki kısım (3+ harf) da aday olur, çünkü Türkçe yazımda kesme özel adı ekinden ayırır: Mehmed'in → mehmed → mehmet.
5. **Sorgu** (`hl_parse`): kelimelerin hepsi geçmeli; `"tırnak"` yan yana, katlanmış, kök ve önek yok; `-kelime` birebir (katlanmış) hariç tutar. Tireli sorgu kelimesi bitişik hâliyle ya da parçaları yan yana eşleşir.
6. **Kademe:** 1* (birebir, yazımı da birebir) > 1 birebir > 2 kök > 3 önek > parça (yalnızca Source, `pg_trgm` + `LIKE`). Note'un kademesi en kötü kelimesininki; sonra kademeler toplamı; sonra yeni yakalanan önce.

## Sonuç (PostgreSQL 17.11)

49/49 senaryo ve 5/5 sıralama kontrolü geçiyor. Bir satırın kademesi, Enes'in kararıyla değişti (2026-10-29):

| # | Sorgu | Metin | #16'da | Şimdi |
|---|---|---|---|---|
| 4 | ulema | ulemanın görüşü | ✓ 3 (önek) | ✓ 2 (kök) |

Bu satır, 26. satırla aynı yapıda ve ikisini birlikte geçen bir yapılandırma yok:

| # | Sorgu → kökü | Not kelimesi → kökü | Beklenen |
|---|---|---|---|
| 4 | ulema → `ule` | ulemanın → `ulema` | 3 |
| 26 | gitmiş → `git` | gitmişti → `gitmiş` | 2 |

İki satırda da sorgu kelimesi, notun kelimesinin köküne eşit. Kök bulucu ise sorgunun kendisini fazla kırpıyor. Kök eşleşmesi kelimenin kendisini kök kümesine katarsa iki satır da 2. kademeye düşer. Yalnızca kök bulucunun çıktılarını karşılaştırırsa ikisi de 3. kademede kalır. Not iki durumda da bulunuyor; fark yalnızca sıralamada. Karar: ulemanın, ulema + nın olduğu için sözleşmenin "aynı kök" kuralına uyuyor; 4. satır kök kademesine iner.

## Hız

Tek konteynerde, 20.000 notla (not başına 12–16 kelime) ölçüldü. GIN ön filtresiyle seçici bir sorgu 4 ms sürüyor; 7.651 sonuç döndüren "kadı" 54 ms; üç kelimelik sorgu 24 ms.

## Bilinen gürültü

Kök kümesine kimsenin aramayacağı adaylar da giriyor: ulema → `ulem`, gitmiş → `gitim`, Osmanlılar → `osmanil`, milli → `milil`. Bunlar yalnızca kök ad alanında duruyor. R3 birkaç gerçek çakışma da üretiyor (aşkı → aşık, doğru → doğur). Bunlar ADR-0005'in kabul ettiği türden gürültü.
