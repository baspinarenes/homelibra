# Türkçe tam metin arama motoru seçenekleri

- Tarih: 2026-10-29 · Ticket: baspinarenes/homelibra#5 · Besler: #15 (teknoloji stack ve monorepo yapısı)
- Durum: araştırma tamamlandı; karar #15'te verilecek. Kaynaklar metin içinde `[S#]` ile işaretli, listesi sondadır.

## Soru

Note, Excerpt ve Comment gövdeleri ile Source başlıkları ve Tag adları Türkçe (yer yer Osmanlı Türkçesi transkripsiyonu: â, î, û, ḳ, ʿ) olduğunda tam metin arama için hangi motor uygundur? Boyutlar: (1) çekim eklerinde kök bulma, (2) İ/ı ve I/i büyük-küçük harf eşlemesi, (3) transkripsiyon karakterlerinin normalizasyonu, (4) Expo (React Native) + web istemciden kullanım, (5) küçük ölçekte maliyet, (6) işletme yükü. Adaylar: PostgreSQL yerleşik FTS (`turkish` Snowball, `unaccent`, `pg_trgm`), Supabase üzerinde FTS, Meilisearch, Typesense, OpenSearch/Elasticsearch `turkish` analyzer, cihaz üstü SQLite FTS5.

## Yöntem

- Birincil kaynak kuralı: her motor için resmi dokümantasyon; dokümantasyonun sustuğu yerde motorun kaynak kodu (PostgreSQL, SQLite FTS5, Charabia/Meilisearch, Typesense, Lucene). Blog yazısı kullanılmadı. Kod okuyarak yapılan çıkarımlar "çıkarım" diye işaretlendi.
- Yerel deneyler (bu makinede, 2026-10-29):
  - PostgreSQL 17.11: makinede yerel Postgres yoktu; Docker Desktop başlatılıp resmi `postgres:17` imajıyla (Debian, `datcollate/datctype = en_US.utf8`, provider `libc`) geçici bir konteynerde SQL çalıştırıldı, konteyner silindi, Docker kapatıldı. Supabase Postgres 15 ve 17 sunduğu için [S28] 17 seçildi.
  - SQLite 3.51.0 (`/usr/bin/sqlite3`, `ENABLE_FTS5` ile derlenmiş): `unicode61` (remove_diacritics 0/1/2, `separators`, `categories`) ve `trigram` tokenizer'ları.
  - ICU 78.3 `uconv -x tr-Lower` / `Any-Lower` ve Python 3.14 (`str.lower`, Unicode 16): "tam" (full) ve "basit" (simple) büyük-küçük harf eşlemesi farkını göstermek için.
  - Meilisearch, Typesense ve OpenSearch/Elasticsearch için canlı deney yapılmadı; davranış dokümantasyon + kaynak kodundan çıkarıldı.
- Test kelimeleri: `kitap/kitaplar/kitapları/kitabın/kitabımızdan`, `evlerden`, `öğrenciler`, `üniversitelerinde`, `gelmişti/geliyor`, `İstanbul/İSTANBUL/ISTANBUL/ıstanbul`, `Irmak/ırmak/IRMAK`, `Kitâb-ı ḳadîm`, `ʿulemâ/ulema`, `Şâir/şair`, `İstanbul'da`.
- Postgres deneyinin özü (tam çıktı aşağıdaki bulgulara işlendi):

```sql
SELECT ts_lexize('turkish_stem', 'kitapları');                      -- {kitap}
SELECT to_tsvector('turkish', 'İSTANBUL ıslak Islak kitâb-ı ḳadîm ʿulemâ');
SELECT lower('İSTANBUL'), lower('İSTANBUL' COLLATE "und-x-icu");    -- libc vs ICU kök yerel
CREATE COLLATION tr_icu (provider = icu, locale = 'tr-TR');
SELECT lower('İSTANBUL' COLLATE tr_icu), lower('IRMAK' COLLATE tr_icu);
CREATE EXTENSION unaccent; CREATE EXTENSION pg_trgm;
CREATE TEXT SEARCH CONFIGURATION tr_unaccent (COPY = turkish);
ALTER TEXT SEARCH CONFIGURATION tr_unaccent
  ALTER MAPPING FOR hword, hword_part, word, asciiword, asciihword, hword_asciipart
  WITH unaccent, turkish_stem;
SELECT to_tsvector('tr_unaccent', 'Kitaplar kitabın İstanbul ISTANBUL ıslak kitâb-ı ḳadîm ʿulemâ Şâir');
CREATE INDEX ON t (unaccent(c));            -- HATA: IMMUTABLE değil
ALTER TABLE t ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('tr_unaccent', c)) STORED;
```

## Bulgular

### Karşılaştırma tablosu

| Motor | Türkçe kök bulma | İ/ı, I/i eşlemesi | â î û ḳ ʿ normalizasyonu | Expo + web kullanımı | Küçük ölçek maliyet | İşletme yükü |
|---|---|---|---|---|---|---|
| PostgreSQL FTS (`turkish` + `unaccent` + `pg_trgm`) | Var: Snowball Turkish; yalnız isim ve isim-fiil ekleri, fiil ekleri yok [S19]; aşırı kök bulma gözlendi (ulema→ule, kadim→kadı) [deney] | libc'de İ→i ve I→i (ı değil); ı ile i ayrı lexeme; `unaccent` eklenince ı→i katlanır (toleranslı, kayıplı) [deney, S13] | `unaccent`: â î û ā ī ū ḳ ḫ ṭ ẕ ż ṣ ḥ ş ğ ç ö ü kapsanır; ʿ ʾ için kural yok ve parser bunları harf sayar → ingest'te `translate()` gerekir [S13, deney] | supabase-js `textSearch(column, query, {config, type})` ile doğrudan; ek servis yok [S22, S27] | Supabase Free $0 (500 MB, 1 hafta inaktivite sonrası duraklama) / Pro $25'ten [S26] | En düşük: mevcut veritabanı, generated column + GIN |
| Supabase FTS | Aynı motor (PG 15/17) [S28]; `unaccent`, `pg_trgm`, `fuzzystrmatch`, `pgroonga`, `rum` resmi uzantı listesinde [S24] | Aynı; canlı projenin `datctype`/provider'ı doğrulanmalı (açık soru) | Aynı; özel `unaccent` kural dosyası `$SHAREDIR` ister [S2], yönetilen serviste varsayım: eklenemez | Aynı | Aynı | Aynı |
| Meilisearch | Yok: Charabia normalizer zincirinde stemmer bulunmuyor; eşleme prefix (yalnız son kelime) + typo toleransı ile [S30, S34, S33, S38] | Türkçe için "dotted/dotless i" katlama: ı→i, İ→i, I→i (hepsi tek harfe iner) [S29, S31, S32] | NFKD + nonspacing-mark kaldırma: â→a, ḳ→k; ʿ (Lm) kalır, ≥5 harfli kelimede 1 typo olarak tolere edilir (çıkarım) [S30, S33] | HTTP API; "Default Search API Key" frontend için; RN'de `react-native-url-polyfill` [S35, S37] | Cloud "$20/ay'dan"; XS örnek ≈ $23/ay; self-host MIT ücretsiz [S36] | Ek servis + Postgres→Meili senkronu |
| Typesense | Var: `stem: true` + `locale: "tr"` → Snowball, dil `locale`'den [S39, S42, S43]; Snowball `tr` takma adını tanır [S20] | `locale: tr` yolunda ICU `foldCase()` (Türkçe değil): İ→i+U+0307, I→i (çıkarım, kod) [S41]; varsayılan `en` yolunda iconv `ASCII//TRANSLIT` (davranışı doğrulanmadı) [S41] | `en`: Avrupa diyakritikleri silinir; `tr`: korunur, bulunamazsa typo toleransıyla eşlenir [S40, S44] | HTTP API; search-only / scoped anahtar [S45]; JS kütüphanesi sunucu ve istemci tarafı [S49] | Cloud 0.5 GB: ilk 720 node-saat ücretsiz, sonra 2¢/node-saat (≈$14/ay) [S46]; kıyas sayfası $0.03/saat ≈ $21.6/ay [S48]; self-host GPL [S50] | Ek servis + senkron |
| OpenSearch / Elasticsearch (`turkish` analyzer) | Var: standard → apostrophe → turkish_lowercase → turkish_stop → keyword_marker → Snowball Turkish [S51, S63, S59] | Doğru Türkçe: TurkishLowerCaseFilter İ→i, I→ı, I+U+0307→i [S52, S64, S58] | `asciifolding` â ı İ ḳ ş kapsar, ʿ kapsamaz [S55, S56, S57]; `icu_folding` [S60]; ʿ için `mapping` char filter [S61] | Resmi dokümanda istemciye verilecek arama anahtarı modeli bulunamadı → arka uç proxy (varsayım) | Elastic Cloud Hosted "as low as $99/ay" [S66]; Serverless VCU-saat [S67]; AWS Serverless ≥ ~$173/ay (hesap) [S69]; self-host lisans ücretsiz [S65, S68] | En yüksek: JVM kümesi + senkron |
| SQLite FTS5 (cihaz üstü, `unicode61`) | Yok; `kitap*` prefix sorgusu [S70] | rd=0: İ hiç katlanmaz (token `İstanbul`); rd=1/2: İ→i; I→i; ı asla i'ye katlanmaz [deney, S70, S71] | rd=2: â î û ḳ ş ğ ç ö ü katlanır; ʿ token karakteri → `separators 'ʿʾ'` ile çözüldü [deney, S70] | Expo SQLite: Android/iOS'ta FTS açık (`enableFTS` varsayılan true); web'de hazır wasm FTS'siz, özel `expo/wa-sqlite` derlemesi gerekir [S72] | $0 | Düşük; veri cihazda olmalı (offline-first) |

### Motor notları

**PostgreSQL FTS.** `turkish` konfigürasyonu kurulumla gelen 29 konfigürasyondan biri (deney; psql `\dF` ile listelenir [S7]); `turkish_stem` sözlüğü "snowball stemmer for turkish language" [S8]; kaynak ağacında `stem_UTF_8_turkish` ve `turkish.stop` (53 durak kelime: ve, veya, bir yok — `bir` indekslenir) derlenir [S11, S18]. Konfigürasyon `asciiword/word/hword/hword_part/…` → `turkish_stem`, sayı/url/e-posta → `simple` eşler [S12, deney]. Kök bulma sonuçları: kitap, kitaplar, kitapları, kitabın, kitabımızdan, kitaba → `kitap` (ünsüz yumuşaması çözülüyor); evlerden → `ev`; öğrenciler → `öğrenci`; üniversitelerinde → `üniversite`; gelmişti → `gelmiş`; geliyor → `geliyor` (fiil ekleri yok [S19]); ulema → `ule`, kadim → `kadı` (aşırı kök bulma: "kadı" ile "kadîm" aynı lexeme). Diyakritikli giriş kök bulmayı engeller: `kitâb` ve `ʿulemâ` değişmeden kalır; `unaccent` sonrası `kitâb` → kitab → `kitap` (transkripsiyonlu ve sade yazım birleşir). Parser `İstanbul'da`'yı kesme işaretinde böler (istanbul + `da` durak kelime) [deney]; parserın "harf" tanımı veritabanı `lc_ctype`'ına bağlıdır [S6]. Snowball sözlüğü girdiyi küçültür; PG 18'den itibaren bu küçültme kümenin varsayılan collation provider'ı ile yapılır, önceki sürümlerde her zaman libc [S9, S14]. `lower()` "veritabanı yerelinin kurallarına göre" çalışır [S5]; ICU'da `u_strToLower` collation'ın yereliyle çağrılır [S15], libc'de `towlower_l` [S16]. PG 18 `casefold()` ve tam eşlemeli `PG_UNICODE_FAST` ekledi [S9, S5]; PG 17 `pg_c_utf8` basit eşleme kullanır [S4, S10]. `unaccent` filtreleyen sözlüktür, çıktısı sonraki sözlüğe geçer [S2]; `unaccent()` fonksiyonu STABLE olduğundan doğrudan indeks ifadesinde kullanılamaz ("functions in index expression must be marked IMMUTABLE"), IMMUTABLE sarmalayıcı veya `to_tsvector('tr_unaccent', …)` generated column çalışır [deney]. `pg_trgm` trigramları varsayılan derlemede büyük-küçük harf duyarsızdır ve alfanümerik olmayanları atar [S3]; küçültme `str_tolower` + varsayılan collation ile yapılır, "kelime karakteri" `t_isalnum` [S17]; `show_trgm('ırmak') ≠ show_trgm('Irmak')` olduğundan trigram eşleşmesi de ı/I'da kırılır, `unaccent` sonrası uygulanmalı [deney]. `kitap:*` prefix sorgusu kök bulma sonrası `kitaplar` ve `kitabın`'ı bulur [deney, S21].

**Supabase FTS.** Rehber `to_tsvector/to_tsquery/websearch_to_tsquery`, generated `tsvector` sütunu ve GIN indeksini gösterir, örneklerde `'english'` kullanır [S21]; `textSearch` seçenekleri `config` ve `type: plain | phrase | websearch` [S22]. Expo hızlı başlangıcı `@supabase/supabase-js`'i doğrudan RN'de kullanır [S27]. Uzantılar Dashboard → Database → Extensions veya `create extension` ile açılır, çoğu `extensions` şemasına kurulur [S23]. PGroonga da listede: Groonga tabanlı, "all languages supported" indeks; büyük-küçük harf duyarsız `&@~` araması; Türkçe kök bulma iddiası yok [S25, S24]. Supabase'in sunduğu Postgres sürümleri 15 ve 17 [S28].

**Meilisearch.** Dil sayfası Türkçe'yi "Default" segmentasyon + "Specialized case folding (dotted/dotless i)" ile listeler; whitespace kullanan her dil varsayılan Latin hattından yararlanır [S29]. Charabia hattı: NFKD → (kayıplı) küçük harf (Rust `to_lowercase`, İ→i+U+0307) → nonspacing-mark kaldırma → `TurkishNormalizer` (yalnızca ı→i) [S30, S31, S32]; hatta stemmer yoktur ve dokümantasyonda kök bulma özelliği geçmez [S30, S29, S38]. Prefix yalnız son kelimede [S34]; typo: 5–8 harf 1, >8 harf 2 [S33]. Sonuç: `kitap` sorgusu `kitaplar`'ı prefix ile bulur ama `kitabın`'ı bulmaz (çıkarım: b/p farkı + farklı ek). Çıkarım: `ulema` ↔ `ʿulema` 6 harfli token olarak 1 typo ile eşleşir; canlı doğrulanmadı.

**Typesense.** `locale` alan parametresi (varsayılan `en`, "most European languages"), `stem: true` ("We use the Snowball stemmer", dil `locale`'den) [S39]; kod `validate_language(locale)` → `sb_stemmer_new`, boş `locale` İngilizce'ye düşer [S43, S42]; Snowball modül listesi `turkish,tr,tur` [S20]. Tokenizer: `locale` boş/`en` değilse ICU `BreakIterator` ile bölme, kelime `foldCase()` ile katlanır, ardından yalnız ASCII baytlara `tolower` [S41]; `en` yolunda `iconv_open("ASCII//TRANSLIT","UTF-8")` ile ASCII'ye çevirme [S41]. Rehber: İngilizce alanlarda Avrupa diyakritikleri silinir, diğer `locale`'lerde korunur, bulunamazsa typo toleransı devreye girer [S40]; `prefix` varsayılan true, `num_typos` 2, `min_len_1typo` 4, `min_len_2typo` 7 [S44]. Çıkarım: `locale: "tr"` ile `İSTANBUL` tokenı `i̇stanbul` (U+0307'li) olur, `istanbul` ancak typo ile eşleşir; `IRMAK` → `irmak`, `ırmak` sorgusu 1 typo. Canlı doğrulanmadı.

**OpenSearch / Elasticsearch.** `turkish` analyzer: `standard` tokenizer (UAX #29 [S62]) → `apostrophe` → `turkish_lowercase` → `turkish_stop` → `turkish_keywords` → `turkish_stemmer` [S51, S63]; OpenSearch örneği "Öğrenciler Türk üniversitelerinde öğrenim görüyor" → `öğrenci, türk, üniversite, öğre, görüyor` (öğrenim → öğre aşırı kök) [S63]. `lowercase` filtresi `language: turkish` ile Lucene `TurkishLowerCaseFilter` kullanır [S52, S64]; kod: I → ı, ardından U+0307 geliyorsa i ve işaret silinir [S58]. `apostrophe` "Istanbul'a veya Istanbul'dan" → `Istanbul, veya, Istanbul` [S53]. `stemmer` `language: turkish` Snowball'a bağlanır [S54]. `asciifolding` Basic Latin dışını ASCII'ye katlar [S55]; kapsanan 16 blok arasında "Spacing Modifier Letters" yok [S56], kodda İ→I, ı→i, Ḳ→K, ş→s var [S57]; `icu_folding` UTR#30 katlama + normalizasyon [S60]; ʿ için `mapping` char filter ile `key => value` silme [S61]. Lisans: OpenSearch Apache 2.0 [S65]; Elasticsearch SSPL/AGPLv3/ELv2 seçimli, varsayılan dağıtım ücretsiz [S68].

**SQLite FTS5.** `unicode61`: L*, N*, Co kategorileri token karakteri; "case-insensitive according to the rules defined by Unicode 6.1"; `remove_diacritics` 0/1/2 (1'de çok diyakritikli tek kod noktası, örn. U+1ED9, temizlenmez; 2 tam); `tokenchars`, `separators`, `categories` seçenekleri; `*` prefix [S70]. Katlama tablosu `CaseFolding.txt`'den üretilir, sonra `fts5_remove_diacritic` uygulanır [S71]. Deney (3.51.0): rd=0 tokenları `İstanbul, ı, ırmak, ıstanbul, kitâb, şâir, ʿulemâ, ḳadîm` (hiçbiri birleşmez); rd=2 tokenları `istanbul, ırmak, ıstanbul, kitab, kadim, sair, ulema, ʿulema` → `istanbul` sorgusu İSTANBUL/istanbul/ISTANBUL'u bulur, `ıstanbul`'u bulmaz; `ulema` sorgusu `ʿulemâ`'yı bulmaz; `separators 'ʿʾ'` veya `categories 'Lu Ll Lt Lo N* Co'` ile bulur. `trigram remove_diacritics 1`: `ulema`, `kadim`, `stanbul` alt dizgi olarak bulunur, `ırmak` ile `irmak` yine ayrı. Expo SQLite: Android/iOS/macOS/tvOS/Web; `enableFTS` varsayılan true, yalnız Android/iOS'a uygulanır; "On web, expo-sqlite uses a prebuilt WebAssembly build of SQLite without full-text search (FTS)" [S72].

### İ/ı ve diyakritik tuzakları

Unicode gerçekleri (Python 3.14 ile doğrulandı): `İ` (U+0130) tam küçültmede `i` + U+0307 (iki kod noktası), basit eşlemede `i`; NFKD'si `I` + U+0307; `ı` (U+0131) büyütülünce `I`; `I` Türkçe dışı kurallarda `i`. Gözlenen eşlemeler:

| Uygulama | İSTANBUL → | IRMAK → | Kaynak |
|---|---|---|---|
| glibc `en_US.utf8` (PG 17 libc varsayılan; `lower`, FTS, pg_trgm) | istanbul | irmak | deney, S16 |
| PG ICU `und-x-icu` / `en-US-x-icu` (`lower`, ILIKE) | i̇stanbul (`'istanbul'` ile eşit değil) | irmak | deney, S15 |
| PG ICU `tr-TR` (`CREATE COLLATION … locale='tr-TR'`) | istanbul | ırmak | deney, S4 |
| PG builtin `pg_c_utf8` (basit eşleme) | istanbul | irmak | deney, S4 |
| ICU 78 `Any-Lower` / `tr-Lower` (uconv) | i̇stanbul / istanbul | irmak / ırmak | deney |
| Python `str.lower` (tam eşleme) | i̇stanbul | irmak | deney |
| SQLite FTS5 `unicode61` rd=0 / rd=1,2 | İstanbul / istanbul | irmak | deney, S70, S71 |
| Lucene `TurkishLowerCaseFilter` (ES/OpenSearch `turkish`) | istanbul | ırmak | S58 (kod) |
| Charabia (Meilisearch) | istanbul (ı da i'ye) | irmak | S30–S32 (kod, çıkarım) |
| Typesense `locale: tr` (`foldCase`) | i̇stanbul | irmak | S41 (kod, çıkarım) |

Sonuçları:

1. Türkçe doğru küçültme yalnız ES/OpenSearch `turkish_lowercase` ve PG'de açık `tr-TR` ICU collation ile elde edilir. Ancak PG FTS/pg_trgm 18 öncesinde collation'ı hiç kullanmaz (her zaman libc) [S9, S14]; `lower(c COLLATE "tr-TR-x-icu")` yalnız `ILIKE`/karşılaştırma için işe yarar (deney: `'IRMAK' ILIKE 'ırmak'` varsayılanda false, `tr_icu` ile true).
2. ICU kök/İngilizce yerelli veritabanında `lower('İSTANBUL')` iki kod noktalı `i̇stanbul` döndürür; `'istanbul'` ile eşleşmez, `ILIKE` de false döner (deney). PG 18'de FTS varsayılan provider'ı kullanmaya başladığı için ICU-varsayılanlı bir kümede `turkish` konfigürasyonu da bu davranışı devralır; sürüm notu yeniden indeksleme önerir [S9].
3. libc/`pg_c_utf8`/FTS5/Charabia/Typesense `I`'yı `i` yapar: büyük harfle yazılmış `Isparta`, `Irak`, `IRMAK`, `ISLAK` indekste `isparta/irak/irmak/islak` olur, kullanıcı `ısparta/ırmak/ıslak` yazarsa bulunmaz (deney: `to_tsvector('turkish','IRMAK') @@ 'ırmak'` → false). Tek güvenli çözüm ya Türkçe-duyarlı küçültme (ES) ya da ı→i katlaması (`unaccent`, Charabia): ikincisi kayıplıdır (`kadı`/`kadi`, `ıslak`/`islak` birleşir) ama kelime başı/büyük harf tuzağını kapatır; `tr_unaccent` ile hem `irmak` hem `ırmak` sorgusu `ırmak kenarında`'yı buldu (deney).
4. SQLite FTS5 rd=0'da `İ` hiç küçülmez; `İstanbul` tokenı `istanbul` sorgusuyla eşleşmez (deney). Çıkarım: `CaseFolding.txt`'de U+0130 için yalnız F (tam) ve T (Türkçe) satırı bulunur, basit (C/S) satır yoktur; FTS5 basit katlama yaptığı için rd≥1'deki diyakritik silme adımı dolaylı çözüm olur. `ı` ise hiçbir rd değerinde `i`'ye katlanmaz; uygulama katmanında normalize edilmelidir.

Diyakritik ve transkripsiyon karakterleri:

| Karakter | PG `unaccent` [S13, deney] | FTS5 rd=2 [deney] | Lucene `asciifolding` [S56, S57] | Charabia [S30, çıkarım] |
|---|---|---|---|---|
| â î û ā ī ū | a i u a i u | a i u | a i u | a i u (NFKD + mark kaldırma) |
| ḳ ḫ ṭ ẕ ż ṣ ḥ | k h t z z s h | k (ḳ test edildi) | K/k (Ḳ/ḳ listede) | k (NFKD: k + U+0323) |
| ş ğ ç ö ü | s g c o u | s g c o u | s | s g c o u |
| ı / İ | i / I | ı kalır / i | i / I | i / i |
| ʿ ʾ (U+02BF/02BE, kategori Lm) | kural yok, kalır; parser harf sayar | token karakteri (L*) | blok listesinde yok | Lm → kalır (çıkarım) |

Çözüm desenleri: PG'de generated column içinde `to_tsvector('tr_unaccent', translate(c, 'ʿʾ', ''))` [S5]; FTS5'te `separators 'ʿʾ'` (deney); ES'te `mapping` char filter [S61]; Meilisearch/Typesense'te 1 typo toleransı (çıkarım). `unaccent` tüm Türkçe harfleri de ASCII'ye katladığı için `şair`/`sair` (deney: eşleşir) gibi çiftler birleşir; akademik kullanımda bu "toleranslı arama" olarak kabul edilebilir ama kesin arama için kökleştirilmemiş/katlanmamış ikinci bir `tsvector` (`simple` tabanlı) gerekebilir. Kök bulma `unaccent` sonrasına konduğunda ünlü uyumu etkilenebilir; test edilen kelimelerde sonuç değişmedi (`kitabı`/`kitabi` → kitap; `ıslak`/`islak` kök bulunmadı), ama `kadim` → `kadı`, `ulema` → `ule` aşırı köklemesi Snowball'un kendisinden gelir ve her motorda (ES/OpenSearch ve Typesense Snowball kullanır) aynıdır.

## Öneri

1. **Birincil arama: Supabase PostgreSQL FTS, özel `tr_unaccent` konfigürasyonu.** `unaccent` → `turkish_stem` zinciri; Note/Excerpt/Comment gövdeleri ve Source başlıkları için `GENERATED ALWAYS AS (to_tsvector('tr_unaccent', translate(coalesce(text,''), 'ʿʾ', ''))) STORED` sütunu + GIN; sorgu `websearch_to_tsquery('tr_unaccent', q)`, yazarken `:*` prefix, sıralama `ts_rank`; Library/Collection filtreleri aynı `WHERE`'de. Gerekçe: Türkçe isim köklemesi var (deney), İ/ı tuzağı ı→i katlamasıyla kapanıyor (deney), transkripsiyon harfleri `unaccent` ile tek biçime iniyor (deney), ek servis ve senkron yok, Expo/web'den supabase-js ile doğrudan [S22, S27], maliyet mevcut Supabase planı [S26].
2. **Belirsiz yazım ve kısa alanlar için `pg_trgm`.** Source başlığı, Tag adı ve Locator gibi kısa alanlarda IMMUTABLE `f_unaccent(text)` sarmalayıcısı üzerinde GIN `gin_trgm_ops` indeksi; `ILIKE '%…%'` ve `similarity` ile hem yazım hatası hem `ʿulemâ`↔`ulema` gibi alt dizgi eşleşmesi (deney: alt dizgi bulundu) sağlanır [S3]. Locator değerleri (yaprak/sayfa) kök bulmaya girmemeli, `simple`/trigram ile aranmalı.
3. **Cihaz üstü SQLite FTS5 yalnız çevrimdışı/yerel arama için, ikincil.** Native'de `tokenize = "unicode61 remove_diacritics 2 separators 'ʿʾ'"`; `ı`'yı FTS5 katlamadığından uygulama katmanında ortak bir normalizasyon fonksiyonu (İ→i, ı→i, NFKD + işaret silme, ʿʾ silme) hem indekslenen metne hem sorguya uygulanmalı; kök bulma yerine `kelime*` prefix. Web'de hazır wasm FTS'siz [S72]; web aramasını sunucuda (madde 1) tutmak daha ucuz.
4. **Meilisearch/Typesense şimdilik ertelensin.** "Yazarken anında, typo-toleranslı" arama ürün gereksinimi olursa Typesense (`locale: "tr"`, `stem: true`) daha yakın aday: Snowball Türkçe köklemesi var [S39, S20], ama `İ` katlaması ICU varsayılanı (çıkarım, canlı test şart) ve her ikisi Postgres→indeks senkronu ister. Meilisearch'te kök bulma yok [S30], ı/i katlaması hazır [S31]. Maliyet düşük (≈$14–23/ay veya self-host) [S36, S46].
5. **OpenSearch/Elasticsearch şimdi değil.** Türkçe analyzer'ı en doğru olan (I→ı, apostrof, Snowball) [S51, S58], ama hosted ≥ $99/ay [S66] veya AWS Serverless'ta ~$173/ay (hesap: 0.5+0.5 OCU × 720 saat × $0.24 [S69]) ve JVM kümesi işletmesi bu ölçekte orantısız.

Karar kapısı (#15 öncesi, gerçek Supabase projesinde): `SELECT datcollate, datctype, datlocprovider FROM pg_database WHERE datname = current_database();` (PG 17'de `SHOW lc_ctype` hata verir, deney) — libc + UTF-8 bekleniyor; `C`/`POSIX` çıkarsa parser Türkçe harfleri harf saymaz [S6]; `create extension unaccent; create extension pg_trgm;` [S23, S24]; `SELECT collname FROM pg_collation WHERE collname = 'tr-TR-x-icu';` (ILIKE için ICU var mı).

## Açık sorular

- Supabase canlı projesinin `datctype`/provider değeri ve ICU collation'larının varlığı (yukarıdaki sorgular). PG 18'e yükseltmede FTS küçültmesi provider'a geçer; ICU-varsayılanlı olursa yeniden indeks ve `tr-TR` seçimi gerekir [S9].
- Snowball Türkçe aşırı köklemesinin (kadîm→kadı, ulema→ule, öğrenim→öğre [S63]) akademik sözlükteki yanlış eşleşme oranı: örnek Note/Excerpt derlemiyle ölçülmeli; gerekirse kökleştirilmemiş ikinci `tsvector` ve ağırlıklı `ts_rank`.
- Transkripsiyon normalizasyon tablosu projeye özel tanımlanmalı (ā ile â, ḳ ile k, ʿ/ʾ, `-ı` izafet eki `kitâb-ı`'nın `kitab` + `ı` olarak bölünmesi deneyde görüldü) → GLOSSARY/ADR adayı.
- Typesense `locale: "tr"` + `stem: true` ile `İstanbul`, `IRMAK`, `ʿulemâ` davranışı ve Meilisearch'te `ʿulema`↔`ulema` typo eşleşmesi canlı doğrulanmadı.
- Typesense `en` yolundaki `iconv ASCII//TRANSLIT` çevriminin ı/İ/ş çıktısı glibc'ye bağlı, doğrulanmadı [S41].
- Expo web için özel `expo/wa-sqlite` FTS derlemesinin bakım maliyeti; web'de yalnız sunucu araması yeterli mi?
- PGroonga (Supabase'de mevcut [S24, S25]) ve `pg_search`/ParadeDB bu araştırmada değerlendirilmedi; Türkçe normalizasyon/kök bulma yetenekleri ayrı sorudur.
- Supabase'de özel `unaccent` kural dosyası eklenemeyeceği varsayıldı (`$SHAREDIR` gerektirir [S2]); `translate()` ile ingest-time temizlik yeterli kabul edildi.
- AWS OpenSearch yönetilen örnek (t3.small) fiyatları sayfada dinamik yüklendiğinden alınamadı; serverless örneği kullanıldı [S69].

## Kaynaklar

- [S1] PostgreSQL — Text Search Dictionaries (Snowball, filtering dictionary): https://www.postgresql.org/docs/current/textsearch-dictionaries.html
- [S2] PostgreSQL — unaccent: https://www.postgresql.org/docs/current/unaccent.html
- [S3] PostgreSQL — pg_trgm: https://www.postgresql.org/docs/current/pgtrgm.html
- [S4] PostgreSQL — Collation Support (providers, `pg_c_utf8`, `pg_unicode_fast`): https://www.postgresql.org/docs/current/collation.html
- [S5] PostgreSQL — String Functions (`lower`, `casefold`, `translate`): https://www.postgresql.org/docs/current/functions-string.html
- [S6] PostgreSQL — Parsers (harf tanımı `lc_ctype`'a bağlı): https://www.postgresql.org/docs/current/textsearch-parsers.html
- [S7] PostgreSQL — Full Text Search Introduction (`\dF`, `default_text_search_config`): https://www.postgresql.org/docs/current/textsearch-intro.html
- [S8] PostgreSQL — psql Support (`\dFd` listesinde `turkish_stem`): https://www.postgresql.org/docs/current/textsearch-psql.html
- [S9] PostgreSQL 18 Release Notes (FTS varsayılan collation provider; `casefold()`; `PG_UNICODE_FAST`): https://www.postgresql.org/docs/18/release-18.html
- [S10] PostgreSQL 17 Release Notes (builtin collation provider): https://www.postgresql.org/docs/17/release-17.html
- [S11] PostgreSQL kaynak — `src/backend/snowball/Makefile`: https://github.com/postgres/postgres/blob/master/src/backend/snowball/Makefile
- [S12] PostgreSQL kaynak — `src/backend/snowball/snowball.sql.in`: https://github.com/postgres/postgres/blob/master/src/backend/snowball/snowball.sql.in
- [S13] PostgreSQL kaynak — `contrib/unaccent/unaccent.rules`: https://github.com/postgres/postgres/blob/master/contrib/unaccent/unaccent.rules
- [S14] PostgreSQL kaynak — `src/backend/snowball/dict_snowball.c` (`str_tolower(…, DEFAULT_COLLATION_OID)`): https://github.com/postgres/postgres/blob/master/src/backend/snowball/dict_snowball.c
- [S15] PostgreSQL kaynak — `src/backend/utils/adt/pg_locale_icu.c` (`u_strToLower`): https://github.com/postgres/postgres/blob/master/src/backend/utils/adt/pg_locale_icu.c
- [S16] PostgreSQL kaynak — `src/backend/utils/adt/pg_locale_libc.c` (`towlower_l`): https://github.com/postgres/postgres/blob/master/src/backend/utils/adt/pg_locale_libc.c
- [S17] PostgreSQL kaynak — `contrib/pg_trgm/trgm.h`, `trgm_op.c` (IGNORECASE, ISWORDCHR): https://github.com/postgres/postgres/blob/master/contrib/pg_trgm/trgm_op.c
- [S18] PostgreSQL kaynak — `src/backend/snowball/stopwords/turkish.stop`: https://github.com/postgres/postgres/blob/master/src/backend/snowball/stopwords/turkish.stop
- [S19] Snowball — Turkish stemming algorithm: https://snowballstem.org/algorithms/turkish/stemmer.html
- [S20] Snowball kaynak — `libstemmer/modules.txt` (`turkish,tr,tur`): https://github.com/snowballstem/snowball/blob/master/libstemmer/modules.txt
- [S21] Supabase — Full Text Search: https://supabase.com/docs/guides/database/full-text-search
- [S22] Supabase — JavaScript `textSearch()`: https://supabase.com/docs/reference/javascript/textsearch
- [S23] Supabase — Postgres Extensions: https://supabase.com/docs/guides/database/extensions
- [S24] Supabase repo — `packages/shared-data/extensions.json` (dokümantasyonun uzantı listesi): https://github.com/supabase/supabase/blob/master/packages/shared-data/extensions.json
- [S25] Supabase — PGroonga: https://supabase.com/docs/guides/database/extensions/pgroonga
- [S26] Supabase — Pricing: https://supabase.com/pricing
- [S27] Supabase — Expo React Native quickstart: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
- [S28] supabase/postgres README (PostgreSQL 15, 17): https://github.com/supabase/postgres
- [S29] Meilisearch — Language: https://www.meilisearch.com/docs/learn/resources/language
- [S30] Charabia kaynak — `normalizer/mod.rs` (normalizer zinciri): https://github.com/meilisearch/charabia/blob/main/charabia/src/normalizer/mod.rs
- [S31] Charabia kaynak — `normalizer/turkish.rs` (ı→i): https://github.com/meilisearch/charabia/blob/main/charabia/src/normalizer/turkish.rs
- [S32] Charabia kaynak — `normalizer/lowercase.rs` (`char::to_lowercase`): https://github.com/meilisearch/charabia/blob/main/charabia/src/normalizer/lowercase.rs
- [S33] Meilisearch — Typo tolerance: https://www.meilisearch.com/docs/learn/relevancy/typo_tolerance_settings
- [S34] Meilisearch — Prefix search: https://www.meilisearch.com/docs/learn/engine/prefix
- [S35] Meilisearch — Basic security (search key frontend için): https://www.meilisearch.com/docs/learn/security/basic_security
- [S36] Meilisearch — Pricing: https://www.meilisearch.com/pricing
- [S37] meilisearch-js README (React Native polyfill): https://github.com/meilisearch/meilisearch-js
- [S38] Meilisearch — Comparison to alternatives ("stemming" geçmiyor): https://www.meilisearch.com/docs/learn/resources/comparison_to_alternatives
- [S39] Typesense — Collections API (`locale`, `stem`, `symbols_to_index`, `token_separators`): https://typesense.org/docs/latest/api/collections.html
- [S40] Typesense — Locale guide: https://typesense.org/docs/guide/locale.html
- [S41] Typesense kaynak — `src/tokenizer.cpp` (v28.0): https://github.com/typesense/typesense/blob/v28.0/src/tokenizer.cpp
- [S42] Typesense kaynak — `src/stemmer_manager.cpp` (v28.0): https://github.com/typesense/typesense/blob/v28.0/src/stemmer_manager.cpp
- [S43] Typesense kaynak — `src/field.cpp` (v28.0, `validate_language(locale)`): https://github.com/typesense/typesense/blob/v28.0/src/field.cpp
- [S44] Typesense — Search API (`prefix`, `num_typos`, `min_len_1typo`, `min_len_2typo`): https://typesense.org/docs/latest/api/search.html
- [S45] Typesense — API Keys (search-only, scoped): https://typesense.org/docs/latest/api/api-keys.html
- [S46] Typesense Cloud — Prices API: https://typesense.org/docs/cloud-management-api/v1/prices.html
- [S47] Typesense Cloud — Billing process: https://cloud-help.typesense.org/article/billing-process
- [S48] Typesense — Typesense vs Meilisearch (fiyat örnekleri): https://typesense.org/typesense-vs-meilisearch/
- [S49] typesense-js README: https://github.com/typesense/typesense-js
- [S50] Typesense README (GPL lisansı): https://github.com/typesense/typesense
- [S51] Elasticsearch — Language analyzers (`turkish`): https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-lang-analyzer.html
- [S52] Elasticsearch — Lowercase token filter (`language: turkish`): https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-lowercase-tokenfilter.html
- [S53] Elasticsearch — Apostrophe token filter: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-apostrophe-tokenfilter.html
- [S54] Elasticsearch — Stemmer token filter (`turkish` → Snowball): https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-stemmer-tokenfilter.html
- [S55] Elasticsearch — ASCII folding token filter: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-asciifolding-tokenfilter.html
- [S56] Lucene 9.12.1 javadoc — ASCIIFoldingFilter (kapsanan Unicode blokları): https://lucene.apache.org/core/9_12_1/analysis/common/org/apache/lucene/analysis/miscellaneous/ASCIIFoldingFilter.html
- [S57] Lucene kaynak — `ASCIIFoldingFilter.java`: https://github.com/apache/lucene/blob/main/lucene/analysis/common/src/java/org/apache/lucene/analysis/miscellaneous/ASCIIFoldingFilter.java
- [S58] Lucene kaynak — `TurkishLowerCaseFilter.java`: https://github.com/apache/lucene/blob/main/lucene/analysis/common/src/java/org/apache/lucene/analysis/tr/TurkishLowerCaseFilter.java
- [S59] Lucene kaynak — `TurkishAnalyzer.java`: https://github.com/apache/lucene/blob/main/lucene/analysis/common/src/java/org/apache/lucene/analysis/tr/TurkishAnalyzer.java
- [S60] Elasticsearch ICU plugin — ICU folding: https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-icu-folding.html
- [S61] Elasticsearch — Mapping character filter: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-mapping-charfilter.html
- [S62] Elasticsearch — Standard tokenizer (UAX #29): https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-standard-tokenizer.html
- [S63] OpenSearch — Turkish analyzer: https://docs.opensearch.org/docs/latest/analyzers/language-analyzers/turkish/
- [S64] OpenSearch — Lowercase token filter: https://docs.opensearch.org/docs/latest/analyzers/token-filters/lowercase/
- [S65] OpenSearch README (Apache 2.0): https://github.com/opensearch-project/OpenSearch
- [S66] Elastic Cloud Hosted pricing: https://www.elastic.co/pricing/cloud-hosted
- [S67] Elastic Serverless Search pricing: https://www.elastic.co/pricing/serverless-search
- [S68] Elastic — Licensing FAQ: https://www.elastic.co/pricing/faq/licensing
- [S69] Amazon OpenSearch Service pricing: https://aws.amazon.com/opensearch-service/pricing/
- [S70] SQLite — FTS5 (unicode61, trigram, prefix): https://www.sqlite.org/fts5.html
- [S71] SQLite kaynak — `ext/fts5/fts5_unicode2.c`: https://github.com/sqlite/sqlite/blob/master/ext/fts5/fts5_unicode2.c
- [S72] Expo — SQLite (`enableFTS`, web wasm): https://docs.expo.dev/versions/latest/sdk/sqlite/
