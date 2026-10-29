# Mevcut araçlarda kaynak-bağlı not → konu geri çağırma

Araştırma ticket'ı: baspinarenes/homelibra#4 · Tarih: 2026-10-29 · Besler: #10 (MVP olmazsa olmaz listesi ve farklılaşma).

## Soru

Zotero (not ve PDF annotation'ları, etiketler), Obsidian (elle not akışı, etiketler, eklentiler), Readwise (highlight → tag → export), Notion, Logseq, Glasp, Matter ve Highlighted/Bookmarker tarzı uygulamalar şu döngüyü nasıl kuruyor: **kaynağın bir konumuna bağlı not + etiket → konuyla ilgili her şeyi geri çağır**? Bir Türk tarihçisi için nerede tıkanıyorlar?

- Türkçe kitap metadata'sı (Source bilgisi),
- arşiv referansı biçimli Locator'lar (ör. `BOA DH.MKT 1234/56`, varak `vr. 23b`),
- **basılı** kitaptan telefonla Capture (sayfa numarasıyla elle vurgu girilebiliyor mu?),
- Türkçe tam metin arama,
- Excerpt (yazarın kelimesi kelimesine sözleri) ile Comment (okurun kendi sözleri) ayrımı.

## Yöntem

- Yalnızca birincil kaynaklar: araçların resmi dokümantasyonu, resmi özellik sayfaları, resmi API referansları, geliştiricinin kendi App Store açıklaması (Highlighted, Marginalis) ve kaynak kodu (Logseq). İnceleme ve blog yazıları kullanılmadı. Tek istisna açıkça işaretli: Zotero ekibinin ("Zotero Team" rozetli) forum yanıtları [Z14][Z15][Z16]; annotation sayfa numarası ve etiket davranışı resmi dokümanda yazılı olmadığı için.
- Tüm sayfalar 2026-10-29'da okundu; tırnak içindeki ifadeler o günkü metinden çevrildi veya aynen alındı.
- Bir dokümanda bir özellik geçmiyorsa "dokümanda yok" yazıldı; bu "ürün yapamaz" demek değildir. Türkçe'ye özgü davranış (İ/ı, ş/s, ğ/g eşleme) **hiçbir** dokümanda geçmiyor; bu yüzden Türkçe sütunları "belirsiz" ağırlıklı.
- **Varsayım ("Bookmarker"):** bu adla resmi dokümanı olan bir ürün bulunamadı; aramalar yalnızca benzer adlı okuma takip uygulamaları döndürdü. Kategori ("basılı kitaptan vurgu yakalama"), en kapsamlı dokümana sahip iki temsilciyle incelendi: Highlighted (Damir Stuhec) ve Marginalis.
- Terimler GLOSSARY'nin kanonik İngilizce adlarıyla: Source, Note, Excerpt, Comment, Locator, Tag, Collection, Capture, Organizing pass, Library.

## Bulgular

### Döngü araç araç

**Zotero.** Not iki türlü: bir öğeye bağlı child note ve bağımsız standalone note; "diğer her öğe gibi notlar da etiketlenebilir" [Z1]. Not için sayfa/Locator alanı dokümanda tanımlı değil; konum ancak not gövdesine yazılır [Z1]. Konuma bağlı asıl birim **annotation**'dır ve yalnızca bir ek (PDF; Zotero 7'den beri EPUB ve web snapshot) içinde oluşur [Z2][Z10]. Nota eklenen annotation "PDF sayfasına geri bağlantı ve atıf" taşır; "Show on Page" bağlama döndürür; atıf gizlenip gösterilebilir [Z2]. Sayfa numarası: okuyucu "sayfadan sayfa numarasını çıkarmayı dener, olmazsa sayfa indeksine düşer" ve numara "çift tıklayarak" düzenlenebilir (Zotero Team, 2022) [Z14]. Annotation'lar veritabanında tutulur; bu sayede "annotation'ları etiketleyip Zotero arayüzü boyunca filtrelemek" mümkün [Z9]. Ancak 2025'te "belirli bir etiketi taşıyan vurguları birden çok PDF'te görmek" sorusuna yanıt "Not currently" idi [Z15]. Zotero 8 (Ocak 2026) annotation'ları öğe listesinde ekin altında gösterdi, etiket seçicisine sürükleyerek etiketlemeyi ve gelişmiş aramada "Item Type is Annotation" koşulunu getirdi [Z11]; Zotero 10 (Ağustos 2026) sonuç düzeyi olarak "annotations" seçmeyi ve "belirli bir etiketi taşıyan üst öğelerin altındaki tüm annotation'ları bulmayı" ekledi [Z12][Z13]. Yani Zotero'da "etiket → konu geri çağırma" annotation düzeyinde ancak 2026'da, masaüstü gelişmiş aramasıyla kapanıyor. Mobil: iOS ve Android uygulamaları barkod tarayarak kitap ekler, PDF'e highlight/note/image/ink annotation koyar, "not alır"; Android'de "DOI, ISBN, PMID" ile ekleme var, EPUB "yakında" [Z7][Z8].

**Obsidian.** Birim dosya (not). Tag `#` ile satır içine yazılır; harf, rakam, `_`, `-`, `/` ve "yaygın kabul gören Unicode karakterler" geçerli (Türkçe harfler buna girer, dokümanda ayrıca anılmıyor), büyük/küçük harf duyarsız, `/` ile iç içe [O1]. Property'ler (YAML) yalnızca dosya düzeyinde; blok düzeyi property yok [O3]. Bases çekirdek eklentisinde "her satır bir dosya" [O4]. Paragraf düzeyinde adres için blok kimliği `^id`; kimlik "yalnızca Latin harfleri, rakam ve tire" içerebilir ve "Obsidian dışında çalışmaz" [O5]. Geri çağırma: `tag:` operatörü ve `block:` (aynı blokta eşleşme); arama varsayılan harf duyarsız; aksan/dil hakkında ifade yok [O2]. Kaynak-bağlı not akışı tamamen el yapımı: Source için dosya, Locator'ı ve Excerpt'i (alıntı bloğu) ve Comment'i (paragraf) yazma disiplini. Topluluk eklentileri "sizin adınıza üçüncü taraf kod çalıştırır, zarar verebilir" uyarısıyla gelir [O7]; iOS/Android uygulamasında da eklentiler çalışır [O6].

**Readwise.** Birim highlight: `text` (tek zorunlu alan), `note`, `location` (tam sayı), `location_type` ∈ {`page`, `location`, `none`, `order`, `offset`, `time_offset`} [R3]. Etiket iki katman: highlight tag ve document tag; "highlight tag'leri ile document tag'leri arasında kalıtım yok" [R6]; document tag Şubat 2021'de eklendi, öncesinde etiket "yalnızca highlight'lara" özeldi [R8]. Satır içi etiketleme: nota `.olasılık` gibi nokta ile başlayan tek kelime yazılırsa senkronda etikete dönüşür; `.h1`, `.c1` gibi "action tag"ler de aynı not alanından çalışır [R7] — Comment alanı aynı zamanda etiket ve komut kanalı. Basılı kitap: iOS/Android Highlights uygulamasında kamera OCR'ı ("Select the exact passage" / "Scan your physical highlights"), kayıt ekranında "sayfa numarası veya not" eklenebilir, "herhangi bir dildeki kitaplarla" çalışır, internet gerekir; yazma ve sesle giriş de mobilde [R1]. Web'de Freeform Input (tek tek) ve CSV (toplu; sütun listesi giriş gerektiriyor, doğrulanamadı) [R2]. Arama: "highlight metni ve belge metadata'sı"; mobilde Search sekmesi [R9]. Dışa aktarma: Obsidian eklentisi "append-only", etiketler `[[tag]]` alt madde, Readwise'daki düzenlemeler Obsidian'a yansımaz [R5]; Notion veritabanı senkronu, Markdown/CSV indirme [R4].

**Notion.** "Veritabanına girdiğiniz her öğe bir Notion sayfasıdır" [N1]; Tag = Multi-select ("bir veya daha fazla tag seç", düz liste) [N2]; Source↔Note bağı Relation ile, tek/çift yönlü [N3]; Excerpt için "Quote" bloğu var ama yalnızca görsel ("alıntıları belgenin kalanından ayırmak için daha büyük metin") [N4]. Arama "select ve multi-select tag değerlerini" ve yorumları kapsamaz; dil notu yalnızca CJK için [N5]. Dışa aktarma Markdown & CSV (callout bloğu HTML'e düşer), HTML, PDF; tüm çalışma alanı dışa aktarımı masaüstü/web [N6]; iOS/Android uygulaması [N7]. Döngü tamamen kullanıcı tasarımı: Notes DB + Sources DB + Relation + Multi-select.

**Logseq.** Birim blok; "herhangi bir blok veya sayfa" `anahtar:: değer` property taşır [L2]. PDF highlight'ı `hls__<dosya>` sayfasında `ls-type:: annotation`, `hl-page:: 1`, `hl-color:: red`, alan vurgusunda `hl-type:: area` property'li bir blok olur [L8][L9]; PDF özelliği "şimdilik yalnızca masaüstü uygulamasında çalışır" [L1]. `tags:: motor, steering wheel` virgülle ayrılmış sayfa referansı [L2]; geri çağırma `{{query (property type book)}}` gibi basit sorgular ve linked references ile; "tam metin sorgu yalnızca masaüstünde" [L3]. Arama "varsayılan olarak sonuçlardan aksanları siler, ör. `räämat` → `raamat`", kapatılabilir; tam metin arama masaüstünde [L4]. Zotero içe aktarımı yerleşik (Zotero sync + API anahtarı gerekir) [L6]. Resmi Tags sayfası boş bir TODO [L7]; iOS/Android sayfaları içeriksiz.

**Glasp.** Web/PDF/YouTube vurgulama, Kindle içe aktarımı (yalnızca Amazon'dan alınan kitaplar) [G1]. PDF için dört renk, "her pasaja not", "Tag highlights as you make them", "Page numbers kept with every highlight" [G2]. Dışa aktarma: Notion, Obsidian, Readwise, Roam, Tana, Workflowy, Zotero, Anki; TXT/CSV/MD (web) ve MD/HTML/CSV/TXT/JSON (PDF sayfası) [G1][G2]. Mobil (iOS/Android): web (Reader View), PDF, görsel ("long-press"), YouTube transkripti; içe aktarım Readwise, Hypothesis, Instapaper, Medium, Snipd, Raindrop [G3]. Basılı kitaptan elle giriş dokümanda yok [G1][G3]. Arayüz 7 dil, Türkçe yok [G3].

**Matter.** "iPhone, iPad ve web" [M1]; içerik türleri `article, video, podcast, pdf, tweet, newsletter` — kitap türü yok [M5]. Annotation = `text` + isteğe bağlı `note`; konum/sayfa alanı yok [M3]. Tag yalnızca item'a ("Add a tag to an item", ad "case-insensitive") [M4]. Arama uç noktası "şimdilik yalnızca `items`" [M6]; "Offline Search: tam metinde ve makale içinde çevrimdışı ara" [M1]. Obsidian'a "Matter highlight'ları ve notları" senkronu [M7]. API için Pro abonelik [M2].

**Highlighted (Apple).** Kamera veya fotoğraftan OCR, Kindle ve CSV içe aktarımı; ISBN barkodu; sayfa numarası algılama ve 2025.4'ten beri "Roma rakamı, sayfa aralığı veya herhangi bir metin" sayfa olarak; akıllı önerili etiket, not, favori, Collection, Reading status, bölüm; kitap/koleksiyon/etikete göre filtreli arama; PDF/Markdown/CSV/RTF/düz metin dışa aktarma ("not, etiket ve sayfa numaraları dahil"); çevrimdışı; iPhone/iPad/Mac/Vision, Android yok; 16 arayüz dili, Türkçe yok; ücretsiz + Highlighted+ [H1].

**Marginalis (iPhone).** iOS Live Text ile kameradan yakalama; paylaşım uzantısı "kitap, not türü, sayfa numarası, etiketler ve kişisel yorum" seçtirir; not türleri Quote / Idea / Question / Reaction / Summary; kitap ekleme barkod, ad arama veya elle; iCloud senkronu; Markdown dışa aktarma; iOS 17+ [H2].

### Karşılaştırma tablosu A: döngü mekaniği

| Araç | Not'un bağlandığı Locator | Excerpt / Comment ayrımı | Tag modeli | Konuya göre geri çağırma (Collection karşılığı) |
|---|---|---|---|---|
| Zotero | Annotation: ek içindeki sayfa; numara düzenlenebilir (forum) [Z14]. Not: Locator alanı yok [Z1] | Annotation metni vs. annotation yorumu; notta alıntı + atıf bloğu, atıf gizlenebilir [Z2] | Düz; öğe, not ve annotation'a [Z3][Z9] | Tag seçici + saved search [Z3]; annotation'lar için Zotero 8/10 gelişmiş arama [Z11][Z12] |
| Obsidian | Dosya; blok için `^id` (yalnızca Latin) [O5] | Yok; `>` alıntı vs. paragraf disiplini | Düz + `/` iç içe, Unicode, harf duyarsız [O1] | `tag:`/`block:` arama [O2]; Bases dosya düzeyi [O4] |
| Readwise | `location` tam sayı + `location_type` [R3] | `text` vs. `note`; `note` aynı zamanda etiket/komut kanalı [R3][R7] | Highlight tag + document tag, kalıtımsız [R6] | Arama (metin + metadata) [R9]; Obsidian/Notion export [R4][R5] |
| Notion | Satır = sayfa; Locator = kullanıcı property'si [N1] | Yok; Quote bloğu görsel [N4] veya iki Text property | Multi-select, düz [N2] | Veritabanı filtre/görünüm; arama tag değerini taramaz [N5] |
| Logseq | Blok property `hl-page::` (PDF, masaüstü) [L8][L1]; elle property mümkün [L2] | Yok; blok ağacı disiplini | `tags::`/`#tag` = sayfa referansı [L2] | `{{query}}` + linked references [L3] |
| Glasp | PDF sayfa numarası otomatik [G2] | Highlight + not [G2] | Highlight'a düz tag [G2] | Kütüphane araması; export [G2] |
| Matter | Konum alanı yok [M3] | `text` vs. `note` [M3] | Yalnızca item'a [M4] | Item filtresi; arama yalnızca item [M6] |
| Highlighted | Sayfa: sayı, Roma rakamı, aralık, serbest metin [H1] | Highlight + not [H1] | Düz tag + Collection [H1] | Kitap/koleksiyon/etiket filtreli arama [H1] |
| Marginalis | Sayfa numarası alanı [H2] | Not türleri (Quote vs. Idea…) + kişisel yorum [H2] | Tag [H2] | Etiket bulutu, App Search [H2] |

### Karşılaştırma tablosu B: Türk tarihçisi için tıkanmalar

| Araç | Türkçe kitap metadata'sı | Arşiv referansı Locator (`DH.MKT 1234/56`, `vr. 23b`) | Basılı kitaptan telefonla Capture (sayfa no ile) | Türkçe tam metin arama |
|---|---|---|---|---|
| Zotero | ISBN: "Library of Congress, WorldCat ve diğer kataloglar" [Z6]; elle giriş var | Öğe düzeyinde "Archive", "Loc. in Archive", "Pages" [Z5]; not düzeyinde alan yok [Z1] | Hayır: mobilde barkodla kitap eklenir, not alınır ama not sayfaya bağlanmaz; annotation yalnızca ek içinde [Z7][Z8][Z2] | Belirsiz; Zotero 10 "çoğu yerde aksanları yoksayar", CJK deyim eşleşmesi [Z12]; İ/ı için ifade yok |
| Obsidian | Elle | Serbest metin, yapısız | Elle yazma (mobil uygulama) [O6] | Harf duyarsız; aksan/dil ifadesi yok [O2] |
| Readwise | Elle (başlık/yazar) [R1] | Hayır: `location` tam sayı [R3] | Evet: OCR/yazma/dikte + sayfa + not, iOS/Android, internet şart [R1] | Belirsiz [R9] |
| Notion | Elle | Serbest property | Elle, mobil uygulama [N7] | Belirsiz; yalnızca CJK notu [N5] |
| Logseq | Elle; Zotero içe aktarımı [L6] | Serbest property [L2] | Elle; PDF yalnızca masaüstü [L1] | Aksan silme varsayılan [L4]; İ/ı belirsiz |
| Glasp | Elle / Kindle [G1] | Yok | Hayır (dokümanda yok) [G3] | Belirsiz; arayüzde Türkçe yok [G3] |
| Matter | Kitap türü yok [M5] | Yok [M3] | Hayır | Belirsiz |
| Highlighted | ISBN barkodu (katalog belirtilmiyor) [H1] | Serbest metin sayfa [H1] | Evet, yalnızca Apple [H1] | Belirsiz; arayüzde Türkçe yok [H1] |
| Marginalis | Barkod / ad arama / elle [H2] | Sayfa alanı (tür belirsiz) [H2] | Evet, yalnızca iPhone [H2] | Belirsiz |

### Tıkanma noktalarının özeti

1. **Basılı kitap + sayfa + Android.** Sayfa numaralı elle Capture'ı en iyi yapanlar (Highlighted, Marginalis) Apple'a kapalı [H1][H2]. Readwise Android'de var ama Locator tam sayı [R1][R3]. Zotero mobil kitabı barkodla ekler, fakat notu sayfaya bağlayamaz [Z7][Z8][Z1].
2. **Arşiv referansı.** Hiçbir araçta "hem serbest metin hem sıralanabilir" Locator yok: ya tam sayı (Readwise [R3]), ya yapısız metin (Obsidian/Notion/Logseq), ya yalnızca öğe düzeyi (Zotero "Loc. in Archive" [Z5]). Highlighted'ın "herhangi bir metin" sayfası tek istisna, ama ISBN'li kitap merkezli [H1].
3. **Tag kalıtımı ve Collection.** Readwise açıkça "kalıtım yok" [R6]; Matter'da tag yalnızca item'da [M4]; Zotero'da "etiketli öğenin annotation'larını" bulma 2026'da masaüstü gelişmiş aramaya geldi [Z12]; Notion araması tag değerini taramaz [N5]. "Seçilen etiketleri taşıyan tüm Note'lar + etiketli Source'ların notları" tek görünümde hiçbir araçta hazır değil.
4. **Türkçe.** Hiçbir doküman Türkçe'yi anmıyor. Genel aksan duyarsızlığı yalnızca Zotero 10 [Z12] ve Logseq [L4] dokümanında; İ/ı ve I/ı eşlemesi hiçbirinde. Arayüz dili listelerinde Türkçe yok (Glasp [G3], Highlighted [H1]). Metadata'da Zotero ABD/dünya kataloglarına dayanır [Z6]; Türkçe kapsama #6'nın konusu.
5. **Excerpt/Comment.** Ayrı alan var (Readwise, Matter, Glasp, Highlighted) ama Excerpt zorunlu: Readwise'da `text` "tek zorunlu alan" [R3]; yalnızca Comment'ten oluşan Note kurulamaz. Readwise'da Comment alanı etiket/komut kanalı [R7]. Marginalis not türleriyle en yakın model [H2]. Serbest editörlerde (Obsidian, Notion, Logseq) yalnızca biçimlendirme disiplini.
6. **Mobil-masaüstü ayrışması.** Zotero'nun konu geri çağırması masaüstü gelişmiş aramasında [Z12]; Logseq PDF ve tam metin sorgu masaüstünde [L1][L3]; Readwise Freeform/CSV web'de [R2].

## Homelibra için farklılaşma adayları

Harita kararlarıyla (#1) uyumlu, kanıta bağlı adaylar; öncelik sırası #10'da verilecek.

1. **Locator = serbest metin + isteğe bağlı sıralama sayısı, Note'un birinci sınıf alanı.** `vr. 23b`, `DH.MKT 1234/56`, `s. 112`, `12:30` aynı alana sığar ve Source içinde sıralanır. Hiçbir rakipte bu bileşim yok (bkz. Tıkanma 2). Kontrast: Readwise tam sayı [R3], Zotero yalnızca öğe düzeyi [Z5].
2. **Note = Excerpt ve/veya Comment; en az biri dolu.** Yalnızca Comment'li not (Readwise'da imkânsız [R3]) ve Comment'in etiket kanalı olmaması (Readwise `.tag` [R7] ile kontrast). Markdown kopyada Excerpt tırnak içinde, Comment ayrı; atıf biçimlendirme kapsam dışı kalır.
3. **Basılı kitap için klavye Capture'ı, Android + web'de.** Highlighted/Marginalis'in Apple sınırını [H1][H2] ve Zotero mobilin "not sayfaya bağlanmaz" boşluğunu [Z7][Z8] doldurur. OCR MVP dışı (harita); ama kategoride OCR standart olduğu için Açık sorular'a bakın.
4. **Tag hem Note'a hem Source'a; Collection = seçilen etiketlerden herhangi birini taşıyan Note'lar, "etiketli Source'ların tüm notlarını dahil et" seçeneğiyle.** Readwise'ın kalıtımsızlığını [R6] ve Zotero'nun 2026'ya kadar süren boşluğunu [Z15][Z12] tek anahtarla kapatır. Semantik #3'te kesinleşir.
5. **Türkçe arama sözleşmesi.** İ/ı ve I/ı eşlemesi, isteğe bağlı aksan duyarsızlığı (ş/s, ğ/g, ç/c, ö/o, ü/u, â/a) ve Excerpt+Comment+Locator'ın tamamının aranması; hiçbir rakip dokümanı bunu vaat etmiyor (Tıkanma 4). Motor seçimi #5.
6. **Collection görünümü: Source'a göre gruplu Note'lar + "Markdown olarak kopyala".** Readwise'ın kitap başına append-only export'una [R5] ve Zotero'nun "Create Note from Annotations" toplu notuna [Z2] karşılık, konu-öncelikli ve mobilde çalışan bir çıktı.
7. **Organizing pass: Source başına etiketsiz Note kuyruğu.** İncelenen dokümanların hiçbirinde "etiketsiz kalanları kaynak kaynak bitir" görünümü yok; Readwise'ın Daily Review'u tekrar/hatırlatma amaçlı, aynı şey değil [R9]. Capture'ın etiketsiz olabilmesi (harita) bu görünümle anlam kazanır.
8. **Türkçe Source metadata'sı: elle giriş birinci sınıf, otomatik doldurma ikincil.** Zotero ISBN için LoC/WorldCat'e dayanır [Z6]; Türkçe yayın kapsaması #6'da ölçülmeden otomatik doldurma vaat edilmemeli.

## Açık sorular

Yalnızca ürün sahibinin karar verebileceği noktalar:

1. **Locator yapısı (#2):** tek serbest metin + sayı mı, yoksa tür (sayfa / varak / arşiv kodu / zaman) + değer mi? Arşiv kodunun Source'a mı (Zotero'daki "Loc. in Archive" gibi [Z5]) Note'a mı ait olduğu da bu karara bağlı.
2. **Collection varsayılanı (#3):** "etiketli Source'ların tüm notlarını dahil et" varsayılan açık mı kapalı mı? Readwise kalıtımsız [R6], Zotero yalnızca gelişmiş aramada [Z12]; Homelibra'nın varsayılanı ürün kimliğini belirler.
3. **OCR'sız Capture kabul edilebilir mi?** Readwise [R1], Highlighted [H1] ve Marginalis [H2] basılı kitaptan yakalamada kamera OCR'ını standart yapmış. Harita OCR'ı kapsam dışı bırakıyor; ilk kullanıcılar klavyeyle Excerpt yazmayı kabul edecek mi, yoksa "fotoğraf ekle, sonra yaz" gibi bir ara yol mu? Prototip #11'de sınanabilir.
4. **Türkçe arama vaadi (#5):** aksan duyarsızlığı varsayılan mı? "Istanbul" yazan "İstanbul"u bulsun mu? Bu, motor seçiminden önce ürün kararı.
5. **ISBN otomatik doldurma MVP'de mi (#6)?** Kapsama ölçülmeden vaat edilirse Türkçe kitaplarda boş dönebilir; "elle gir, varsa ISBN'den tamamla" sırası mı?
6. **Zotero/Readwise'dan içe aktarma zamanlaması:** Readwise API `location_type` ve `note` ile [R3], Zotero annotation'ları notlarla [Z2] dışa verilebiliyor; MVP sonrası (harita) kararı korunuyor mu?
7. **"Bookmarker" belirli bir ürün mü?** Bu dokümandaki varsayım (kategori) yanlışsa ürün adı/bağlantısı ile tek bir ek inceleme yeter.

## Kaynaklar

Zotero
- [Z1] Notes — https://www.zotero.org/support/notes
- [Z2] Zotero PDF Reader and Note Editor — https://www.zotero.org/support/pdf_reader
- [Z3] Collections and Tags — https://www.zotero.org/support/collections_and_tags
- [Z4] Searching — https://www.zotero.org/support/searching
- [Z5] Item Types and Fields — https://www.zotero.org/support/kb/item_types_and_fields
- [Z6] Adding Items to Zotero (Add Item by Identifier) — https://www.zotero.org/support/adding_items_to_zotero
- [Z7] Zotero for iOS — https://www.zotero.org/support/ios
- [Z8] Zotero for Android — https://www.zotero.org/support/android
- [Z9] Annotations in Database — https://www.zotero.org/support/kb/annotations_in_database
- [Z10] Zotero 7 announcement (2024) — https://www.zotero.org/blog/zotero-7/
- [Z11] Zotero 8 announcement (2026-01-22) — https://www.zotero.org/blog/zotero-8/
- [Z12] Zotero 10 announcement (2026-08-17) — https://www.zotero.org/blog/zotero-10/
- [Z13] Changelog (10.0, 2026-08-17: "top-level items, attachments, annotations, or notes" sonuç düzeyleri; "Annotation Type, Color, and Author" koşulları) — https://www.zotero.org/support/changelog
- [Z14] Forum, martynas_b (Zotero Team), 2022-02-08, sayfa numarası çıkarma ve düzenleme — https://forums.zotero.org/discussion/comment/398950
- [Z15] Forum, dstillman (Zotero Team), 2025-03-31, "Not currently" — https://forums.zotero.org/discussion/comment/489490
- [Z16] Forum, dstillman (Zotero Team), 2021-03-26, annotation etiketleme — https://forums.zotero.org/discussion/comment/379132/

Obsidian
- [O1] Tags — https://obsidian.md/help/tags
- [O2] Search — https://obsidian.md/help/plugins/search
- [O3] Properties — https://obsidian.md/help/properties
- [O4] Bases — https://obsidian.md/help/bases
- [O5] Internal links (heading/block) — https://obsidian.md/help/links
- [O6] Obsidian Mobile — https://obsidian.md/mobile
- [O7] Community plugins — https://obsidian.md/help/community-plugins

Readwise
- [R1] Import from Physical Books with OCR — https://docs.readwise.io/readwise/docs/importing-highlights/ocr
- [R2] Import Highlights to Readwise (Freeform Input, CSV) — https://docs.readwise.io/readwise/docs/importing-highlights
- [R3] Readwise API (highlight fields, `location_type`) — https://readwise.io/api_deets
- [R4] Exporting Highlights — https://docs.readwise.io/readwise/docs/exporting-highlights
- [R5] Export to Obsidian — https://docs.readwise.io/readwise/docs/exporting-highlights/obsidian
- [R6] Reader FAQ: Highlights, Tags, and Notes — https://docs.readwise.io/reader/docs/faqs/highlights-tags-notes
- [R7] Action Tags guide (inline tagging) — https://docs.readwise.io/readwise/guides/action-tags
- [R8] Changelog: Document tags (2021-02-02) — https://readwise.io/changelog/document-tags
- [R9] Finding Highlights — https://docs.readwise.io/readwise/docs/faqs/finding-highlights
- [R10] Mobile Apps FAQ — https://docs.readwise.io/readwise/docs/faqs/mobile-apps

Notion
- [N1] Intro to databases — https://www.notion.com/help/intro-to-databases
- [N2] Database properties — https://www.notion.com/help/database-properties
- [N3] Relations and rollups — https://www.notion.com/help/relations-and-rollups
- [N4] Writing and editing basics (block types) — https://www.notion.com/help/writing-and-editing-basics
- [N5] Search — https://www.notion.com/help/search
- [N6] Export your content — https://www.notion.com/help/export-your-content
- [N7] Notion mobile — https://www.notion.com/mobile

Logseq (docs.logseq.com'un kaynağı olan resmi docs deposu ve uygulama kaynak kodu)
- [L1] PDF highlights — https://github.com/logseq/docs/blob/master/pages/PDF%20highlights.md
- [L2] Properties — https://github.com/logseq/docs/blob/master/pages/Properties.md
- [L3] Queries — https://github.com/logseq/docs/blob/master/pages/Queries.md
- [L4] Search — https://github.com/logseq/docs/blob/master/pages/Search.md
- [L5] Block Reference — https://github.com/logseq/docs/blob/master/pages/Block%20Reference.md
- [L6] Zotero integration — https://github.com/logseq/docs/blob/master/pages/Zotero.md
- [L7] Tags (boş TODO sayfası) — https://github.com/logseq/docs/blob/master/pages/Tags.md
- [L8] Örnek `hls__` sayfası (test fixture) — https://github.com/logseq/logseq/blob/master/deps/graph-parser/test/resources/exporter-test-graph/pages/hls__zlib.md
- [L9] PDF uzantısı kaynak kodu (`hl-page`, `hl-color`, `hl-type`, `ls-type`) — https://github.com/logseq/logseq/blob/master/src/main/frontend/extensions/pdf/assets.cljs

Glasp
- [G1] FAQs — https://glasp.co/posts/faqs
- [G2] PDF & Web Highlighter — https://glasp.co/pdf-highlighter
- [G3] Mobile & Tablet App FAQs (güncelleme 2026-10-27) — https://glasp.co/posts/faqs-mobile
- [G4] Kindle highlight import — https://glasp.co/kindle-highlight-import

Matter
- [M1] Ana sayfa — https://www.getmatter.com/
- [M2] Docs — https://docs.getmatter.com/
- [M3] API: List annotations — https://docs.getmatter.com/api/annotations/list.md
- [M4] API: Add tag to item — https://docs.getmatter.com/api/tags/add.md
- [M5] API: Get item — https://docs.getmatter.com/api/items/get.md
- [M6] API: Search — https://docs.getmatter.com/api/search.md
- [M7] Update: Sync to Obsidian — https://www.getmatter.com/updates/sync-to-obsidian

Highlighted / Marginalis (geliştiricinin App Store açıklaması)
- [H1] Highlighted: Book Tracker — https://apps.apple.com/us/app/highlighted-image-to-text/id1480216009
- [H2] Marginalis — https://apps.apple.com/us/app/marginalis/id6760680016
