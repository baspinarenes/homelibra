# Ürün fikirleri: 0.1.10'dan sonra Homelibra'ya ne eklenebilir?

- Tarih: 2026-11-15 · Ticket: yok — sahibin doğrudan isteği · Besler: haritanın (baspinarenes/homelibra#1) "Beta sonrasına, ihtiyaç doğarsa" listesi ve yeni ticket'lar.
- Durum: öneri listesi; hiçbir fikir karara bağlanmadı. Kaynaklar metin içinde `[S#]` ile işaretli, listesi sondadır. Kaynağa dayanmayan yargılar **Çıkarım:** diye ayrıca işaretlidir.

## Soru

"Ürünüme yeni fikir önerileri getirir misin? Ne eklenebilir? Ne onu daha kullanışlı yapar?"

Kapsam: uygulama sürümü 0.1.10'da (`apps/app/app.json`) gerçekten çalışan döngü olan **Capture → Tag → Collection → Markdown kopya**. Ölçüt, tarih ve beşerî bilimler akademisyeninin gerçek iş adımlarından birinde (arşivde ya da kütüphanede Capture, düzenleme, yazarken geri çağırma, atıf, dışa aktarma) bir sorunu çözmek. Genel not uygulaması özellikleri bu belgede başarısızlık sayılır.

## Yöntem

- **Yerel durum (salt okuma).** `GLOSSARY.md`, `docs/adr/` altındaki on bir ADR'nin tamamı, `docs/research/existing-tools.md` (Zotero, Obsidian, Readwise, Notion, Logseq, Glasp, Matter, Highlighted ve Marginalis'e dair önceki rakip araştırması; burada tekrarlanmadı, üstüne kuruldu) ve diğer `docs/research/*.md` dosyalarının başları ve "Açık sorular" bölümleri okundu. Harita (baspinarenes/homelibra#1), 300 issue'luk liste ve birleşmiş son 60 PR okundu. `wontfix` etiketli issue yok. Açık issue'lar yalnızca baspinarenes/homelibra#1 (harita), baspinarenes/homelibra#31 (release öncesi KVKK kontrol listesi) ve baspinarenes/homelibra#76 (Sentry). Bu yüzden "elenmiş" bilgisi haritanın **Out of scope** listesinden, "Beta sonrasına" listesinden ve kaldırma ticket'larından (baspinarenes/homelibra#138, baspinarenes/homelibra#157) geliyor.
- **Kodda doğrulama.** Bir şeye "yok" denmeden önce `apps/app/src` ve `apps/api/src` içinde arandı. Rotalar `apps/app/src/app`, prosedürler `apps/api/src/routers/*.ts`, veri modeli `apps/api/src/db/schema.ts`, kopya biçimi `packages/core/src/lib/markdown.ts`.
- **Kitle.** Haritanın tanımı (ilk kitle Türkiye'deki tarih ve sosyal bilim akademisyenleri, arayüz Türkçe) ve ADR-0001'in iş bölümü (Capture telefonda, geri çağırma masaüstü web'de; önce Android) esas alındı.
- **Dış kaynaklar.** Yalnızca birincil kaynaklar: resmî dokümanlar (Expo, Zotero, Google, YouTube, Internet Archive, Tropy), Türk devlet kurumlarının kendi sayfaları (Devlet Arşivleri Başkanlığı, TTK Belleten), hakemli makaleler (Milligan, Boyd, Klein ve ark.), tarihçilerin kendi iş akışı anlatıları (Heppler, Razlogova), üniversite rehberleri (Trent, Programming Historian) ve Zotero'nun resmî forumu. Liste yazıları ve SEO derlemeleri kullanılmadı. İstisnalar açıkça işaretli: Arşivlerden Yararlanma Yönetmeliği'nin metni Resmî Gazete'de açılamadığı için bir mevzuat sitesindeki kopyasından okundu [S4]. Milligan [S2] ve Boyd [S16] yalnızca özetlerinden, Klein ve ark. [S18] de kısmen okundu.
- **Gizlilik.** Arama sorgularında ürün, depo ya da kişi adı kullanılmadı; yalnızca genel konular arandı. Tüm sayfalar 2026-11-15'te okundu.
- **Sıralama ölçütü.** Değer ÷ efor. **Çıkarım:** baspinarenes/homelibra#138 (Düzenle modu, Organizing pass ve Note merge'ün kaldırılması) ve baspinarenes/homelibra#157 (yazma kutusunun tek "Not al" çubuğuna inmesi) sahibin ekran ve mod azaltma yönünde ilerlediğini gösteriyor. Bu yüzden yeni bir ekran ya da mod eklemeden yetenek kazandıran fikirler üst sıralara konuldu.

## Bugün ne var (0.1.10)?

Fikirleri ölçmek için kısa döküm:

- **Sekmeler:** Genel Bakış · Kaynaklar · Dizin (Dosyalar | Etiketler) · Ara · Ayarlar. Masaüstü web'de (720 px ve üstü, `wideMinWidth`) sol ray çıkıyor. Geniş düzeni bilen öbür tek yer Source formu (`source-form.tsx`). Collection, Ara ve Source sayfası tek sütunlu ve bu baspinarenes/homelibra#12'nin kararı ("Masaüstü ve telefon aynı düzen").
- **Capture:** Source sayfasındaki "Not al" çubuğu ve tam boy yazma sayfası (baspinarenes/homelibra#157). İçinde Konum, Alıntı ve "+ Yorum ekle", "+ etiket" ve kayıttan sonra Geri al var. Android'de outbox çalışıyor (ADR-0008).
- **Source:** dokuz tür. Takvimli Tarih (ADR-0002), DOI ile doldurma, ISBN önerisi, kapak (ADR-0011) ve Reading status var. Kayıt ile Web sayfası türlerinin `url` alanı formda giriliyor ama hiçbir ekranda bağlantı olarak açılmıyor: uygulamada onu açan bir `Linking.openURL` çağrısı yok.
- **Geri çağırma:** Library, Source, Collection ve Tag kapsamlarında Türkçe arama (ADR-0005, ADR-0010). Locator, Tag adı ve Tarih aranmıyor (baspinarenes/homelibra#16). Collection yalnızca OR ve "etiketli kaynakların notları" anahtarlı (ADR-0003).
- **Çıktı:** Collection başına tek biçimli "Markdown olarak kopyala", düz metin olarak (`collection-actions.tsx`, `Clipboard.setStringAsync(collectionToMarkdown(view))`). Core'da `sourceToMarkdown` da var, ama uygulamada hiçbir yer onu çağırmıyor. Library export tek ZIP: JSON, Source başına Markdown ve kapaklar.
- **Kaldırılanlar:** Organizing pass, Düzenlenecekler, Düzenle modu, toplu işlemler ve Note merge (baspinarenes/homelibra#138), yorum bağlama şeridi (baspinarenes/homelibra#157).

## Bulgular: sıralı fikirler

### Hızlı kazanımlar

#### 1. Kopya Word'e biçimiyle yapışsın (zengin metin kopya) · Boy: S

- **Sorun ve kim.** Her tarihçi, *yazarken geri çağırma* adımında. Bugünkü kopya düz Markdown. **Çıkarım (denenmedi):** Word'e ya da Google Docs'a yapıştırınca `>`, `**s. 52**` ve `##` işaretleri metinde ham kalır ve elle temizlenmeleri gerekir.
- **Kanıt.** Türk tarihçisinin başlıca hakemli dergisi Belleten makaleyi "PDF ve Microsoft Word" biçiminde istiyor ve atıfları sayfa altı dipnotu olarak şart koşuyor [S10]. Programming Historian'ın Markdown/Pandoc dersi bile "most journals still insist on submissions in .docx format" diyor; sade metin savunucuları da teslimi Word'e çevirerek yapıyor [S9]. Razlogova notlarını taslak için Scrivener'a aktarıyor [S13]. Teknik olarak Expo Clipboard'un `setStringAsync`'i `inputFormat: StringFormat.HTML` alıyor ve bu Android, iOS ve web'de listeli. Web'de AsyncClipboard API'sine dayandığı için tarayıcılar arasında fark olabileceği yazıyor [S7].
- **Sözlük.** Değişen bir şey yok: aynı Collection, aynı "Markdown olarak kopyala" düğmesi. Alıntı (Excerpt) blok alıntı, Konum (Locator) kalın, Yorum (Comment) düz paragraf olarak çıkıyor.
- **ADR / karar.** Çakışma yok. Atıf biçimlendirme kapsam dışı kalıyor; bu fikir aynı içeriği yalnızca biçimli taşıyor.
- **Durum.** Haritada park edilmiş: "Markdown kopya seçenekleri (… Word/Google Docs için zengin metin kopya); tek biçim dar gelirse." Tek biçimi koruyan bir yol önerilir: HTML ile düz metin yan yana konur, yapıştırılan uygulama hangisini istiyorsa onu alır. Böylece yeni bir seçenek eklenmez.
- **Boy: S.** `packages/core`'da `collectionToMarkdown` yanına bir HTML üreticisi ve tek bir kopya çağrısı gerekiyor. Yeni native modül yok, OTA ile gider.
- **Çıkarım.** Expo dokümanı aynı panoya hem HTML hem düz metin konup konmadığını yazmıyor [S7]. Markdown kopyasını bekleyen kullanıcı da düz metne yapıştırınca Markdown'ı görmeli. Uygulamadan önce Android, Chrome ve Safari'de Word ile Google Docs'a yapıştırılarak denenmesi gerekir. Yalnızca HTML konuyorsa düz metin hedefi bozulabilir. O durumda web'de `ClipboardItem` ile iki tür birlikte konur.

#### 2. Tek bir notu ya da bir Source'un notlarını kopyala · Boy: S

- **Sorun ve kim.** *Yazarken geri çağırma* adımı. Yazarken çoğu zaman bütün Collection değil, tek bir Alıntı ve Konum'u gerekiyor. Ara'da bulunan bir not bugün yalnızca okunabiliyor. Not düzenleme ekranında (`note/[id].tsx`) kopya yok, Source sayfasında da yok.
- **Kanıt.** Tarih bölümlerinin not rehberleri her notun sayfa numarasını taşımasını ve notların yazıya tek tek taşınabilmesini öğütlüyor: her nota ayrı kart, kartlar karıştırılıp bir taslağa dizilebilir, sayfa numarası kartın üstünde [S11]. Belleten'in dipnot örneği kaynak, birim ve belge numarasını bir arada istiyor ("BOA, C. ML, 753/30679") [S10]. Yani yazara giden birim tek not ve Konum'u. Kodda `sourceToMarkdown` hazır (`packages/core/src/lib/markdown.ts`); bugün yalnızca API'nin Library export'u onu çağırıyor (`apps/api/src/export/library-export.ts`), uygulamada hiçbir kopya düğmesi kullanmıyor.
- **Sözlük.** Note, Locator, Source. Biçim Collection kopyasıyla aynı: `## Yazar, Başlık (Tarih)`, `**Konum**`, `> Alıntı`, Yorum.
- **ADR / karar.** Çakışma yok. Atıf biçimlendirme kapsam dışı kalıyor.
- **Durum.** Tek not kopyası yeni. "Source başına kopya" haritada (baspinarenes/homelibra#1) park edilmiş ("Markdown kopya seçenekleri"; "tek biçim dar gelirse").
- **Boy: S.** Not düzenleme başlığına bir kopya ikonu yeterli (baspinarenes/homelibra#129'daki Dosya başlığındaki kopya ikonu gibi). Source sayfası başlığına da bir ikon. Fikir 1 yapılırsa aynı zengin metin yolunu kullanır.

#### 3. Kayıt'ta Konum'dan o ana git; URL'ler açılsın · Boy: S

- **Sorun ve kim.** Belgesel, ders videosu, podcast ya da sözlü tarih kaydından not alan araştırmacı, *geri çağırma* ve *atıf doğrulama* adımında. Konum "12:30" diye yazılı, Source'un URL'si kayıtlı, ama ikisi birbirine bağlı değil. URL hiçbir ekranda bağlantı olarak görünmüyor bile.
- **Kanıt.** Sözlü tarih alanının yaygın aracı OHMS'in amacı "connecting the textual search term to the corresponding moment in the recorded interview online" olarak tanımlanıyor [S16]. YouTube'un kendi yardım sayfası belirli bir andan başlayan bağlantıyı resmî paylaşım yolu olarak veriyor ("check this box and enter the start time") [S15]. Web sayfası Source'ları için: web kaynaklı atıfların bir kısmı zamanla kayboluyor. Klein ve ark. "one out of five STM articles suffering from reference rot" buldu [S18]. Bu ölçüm STM alanında, beşerî bilimlerde değil. Internet Archive bir sayfanın tek seferlik kopyasını "Save Page Now" ile alıyor [S17].
- **Sözlük.** Recording (Kayıt), Web page (Web sayfası), Locator. Kayıt türünün `url` alanı zaten var (`source-layout.ts`).
- **ADR / karar.** Bağlantıyı kullanıcının kendi tarayıcısı açarsa çakışma yok. Sunucunun Internet Archive'a URL göndermesi ise Library içeriğini üçüncü tarafa göndermek olur: ADR-0004'ün sözü ve ADR-0009'un sağlayıcı kontrol listesi devreye girer. Bu yüzden önerilen biçim, kullanıcının açtığı bir "arşivlenmiş kopya" bağlantısı.
- **Durum.** Yeni.
- **Boy: S.** Source sayfasında `url`'nin bağlantı olması, Kayıt'ın not satırında Konum'a dokununca `Linking.openURL` ile zamanlı bağlantının açılması.
- **Çıkarım.** YouTube yardım sayfası zaman parametresinin adını vermiyor [S15]. Zamanlı bağlantının biçimi her platform için ayrı belirlenmeli ve yalnızca tanınan alan adlarında sunulmalı. Tanınmayan URL'de yalnızca URL açılır.

#### 4. Başka bir uygulamadan paylaşılan metin Alıntı olsun (Android paylaşım hedefi, Google Lens köprüsü) · Boy: M

- **Sorun ve kim.** *Capture* adımı. Uzun bir Alıntı'yı klavyeyle yazmak en yavaş iş. baspinarenes/homelibra#157'nin gerekçesi de "uzun bir Alıntı'ya dar geliyor" idi. Kopyala-yapıştır 0.1.10'da zaten çalışıyor: metin Lens'ten, bir PDF'ten ya da e-kitaptan kopyalanıp yazma sayfasına yapıştırılabiliyor. Eksik olan, bunun sırası: kopyala, Homelibra'yı aç, doğru Source'u bul, "Not al", yapıştır. Bu fikrin kazancı yeni bir yetenek değil, bu adımların teke inmesi; sıralaması da buna göre verildi.
- **Kanıt.** Önceki araştırma basılı kitaptan yakalamada kamera OCR'ının kategoride standart olduğunu gösterdi (Readwise, Highlighted, Marginalis; `existing-tools.md` [R1][H1][H2], Açık soru 3). Harita OCR'ı kapsam dışı bıraktı. Ama Android'de Google Fotoğraflar'daki Lens fotoğraftaki metni seçtirip kopyalatıyor: "To copy text, tap and select the words you'd like to copy" [S8]. Yani OCR'ı Homelibra'nın yapması gerekmiyor. Google'ın sayfası metni kopyalamayı anlatıyor, doğrudan başka bir uygulamaya paylaşmayı anlatmıyor [S8]. **Çıkarım:** Lens'ten gelen yol büyük olasılıkla bugünkü gibi kopyala → yapıştır olarak kalır. Paylaşım hedefi ise PDF okuyucu, tarayıcı ve e-kitap uygulamalarındaki seçili metin için işe yarar. Expo SDK 58'de `expo-sharing` başka uygulamalardan paylaşılan içeriği alabiliyor: Android'de `android.enabled` ve `singleShareMimeTypes` config plugin seçenekleri, `useIncomingShare()` kancası ve `text`, `url`, `image` paylaşım türleri var. Özellik "currently experimental" ve yeni bir native build gerektiriyor [S6]. Milligan'ın 253 tarihçiyle yaptığı ankete göre (özet) araştırmacıların çoğu belgeyi yerinde okumuyor, görüntüsünü alıp sonra ekranda işliyor [S2]. Yani malzemenin önemli bir kısmı zaten ekranda.
- **Sözlük.** Capture, Excerpt, Source ve Locator. Paylaşılan metin, yazma sayfasının Alıntı alanına dolu gelir. Paylaşılan `url` türü, Web sayfası türünde bir Source formunun URL alanına gelebilir. Yeni terim gerekmiyor.
- **ADR / karar.** ADR-0008 ile uyumlu, çünkü not yine outbox'tan gidiyor. ADR-0001: web eşdeğeri yok. **Çıkarım:** web'in karşılığı zaten pano; bu bir platform farkı olarak kabul edilebilir. Haritanın "Tarayıcı eklentisi ve web vurgulayıcı" ile "OCR" maddeleri kapsam dışı; bu fikir ikisine de girmiyor, çünkü işletim sisteminin paylaşım menüsünü kullanıyor ve OCR'ı Lens yapıyor. Yine de sahibin sınırı nasıl yorumladığına bakmak gerekir.
- **Durum.** Yeni. Hiçbir issue ya da PR'da yok. `apps/app/package.json` `expo-sharing` içermiyor. **Çıkarım:** değeri hızlı kazanımlar kadar kesin değil (yukarıya bakın), ve M boyunda, deneysel bir API'ye dayanıyor; bu yüzden üç S fikrinin arkasına kondu. Önce sahibin kendi okuma ortamında ne kadar metnin ekrandan geldiğine bakılmalı. Çoğu basılıysa bu fikir daha da aşağı iner.
- **Boy: M.** Yeni native build gerekiyor (`runtimeVersion` fingerprint olduğu için OTA ile gitmez). Deneysel API var. Paylaşım geldiğinde hangi Source'a yazılacağı seçilmeli: varsayılan Kaldığın yer olabilir, `source-picker.tsx` zaten var. Yazma sayfasının dolu açılması gerekiyor. Uygulama kapalıyken gelen paylaşım ve oturum açık değilken gelen paylaşım ayrıca ele alınmalı.
- **Çıkarım.** Lens'ten gelen metin satır sonları ve tirelemeyle gelir. Alıntı'ya konmadan önce satır birleştirme gibi küçük bir temizlik değerli olur. Ama Alıntı "verbatim" olduğundan temizlik görünür ve geri alınabilir olmalı.

#### 5. Collection içinde geçici etiket daraltması ("ayrıca X'i taşıyanlar") · Boy: S–M

- **Sorun ve kim.** Bir bölüm ya da makale yazarken *geri çağırma* adımı. Collection geniş etiketlerle büyüyor (ör. "vakıf" ve "Halep"); yazarın o an ihtiyacı kesişim oluyor.
- **Kanıt.** Zotero'nun etiket seçicisi varsayılan olarak VE ile çalışıyor: "Only items that have all of the selected tags will be shown" [S12]. Zotero kullanıcıları 2008'den 2026'ya kadar aynı seçicide VEYA da istedi; resmî forumdaki başlıkta ekibin son yanıtı 2012'den ve özellik hâlâ yok [S19]. **Çıkarım:** akademisyenler iki işlemi birlikte kullanıyor. Homelibra VEYA'yı (Collection) verdi, öbür yarısı eksik. Collection içindeki geçici metin araması (baspinarenes/homelibra#3) bugün bunun yarısını kelimeyle yapıyor.
- **Sözlük.** Collection, Tag. Daraltma kaydedilmez, tıpkı Search gibi. Kaydedilen görünüm Collection olmaya devam eder.
- **ADR / karar.** baspinarenes/homelibra#3'ün kararı "Collection yalnızca OR". GLOSSARY'ye göre üyelik yalnızca etiketten gelir. Daraltma üyeliği değiştirmeyip yalnızca görünümü süzerse ikisine de dokunmaz. Kaydedilirse ikisiyle de çelişir. ADR-0003 ile uyumlu: daraltma, kaynak etiketiyle gelen notlara da aynı birleşim kuralıyla uygulanmalı.
- **Durum.** Haritada (baspinarenes/homelibra#1) park edilmiş: "Collection içinde geçici etiket daraltması (AND'in görünüm içi hali); OR yetmezse." Bu koşulun yerine geldiğine dair bir kanıt yok: Zotero kanıtı akademisyenlerin iki işlemi de kullandığını gösteriyor, Homelibra kullanıcılarının OR'u dar bulduğunu göstermiyor. Önce sahibin kendi Collection'larında daraltma ihtiyacı duyup duymadığı sorulmalı.
- **Boy: S–M.** API'deki `collections.view` sorgusuna isteğe bağlı bir etiket kümesi, görünümde de çip seçimi gerekiyor. Markdown kopyası "görünen notların tamamı" kuralına göre daraltılmış listeyi kopyalar (baspinarenes/homelibra#12).

#### 6. Konum'la (arşiv referansıyla) arama · Boy: S–M

- **Sorun ve kim.** Arşivle çalışan tarihçi. Bir fon ya da defter tek Source olarak tutulduğunda (baspinarenes/homelibra#2) belgeler Konum'dur ("C. ML 753/30679", "vr. 23b"). Yazarken bir dipnottaki belgeyi bulmak için Konum yazılamıyor, çünkü Konum aranmıyor (baspinarenes/homelibra#16, senaryo satırı 33: "vr. 12b" → ✗).
- **Kanıt.** Belleten'in dipnot örneği bir belgenin kısa adını Konum biçiminde veriyor: "BOA, C. ML, 753/30679" [S10]. **Çıkarım:** araştırmacının elinde dolaşan ve dipnotta yeniden kullandığı kimlik bu.
- **Sözlük.** Locator, Search.
- **ADR / karar.** baspinarenes/homelibra#16'nın kararıyla açıkça çelişiyor. Gerekçesi "bir kaynağın içindeki yer, Source'un Locator sırasıyla bulunur" idi. ADR-0005 ve ADR-0010 Konum'u katlama/kök kurallarına sokmuyor. Önerilen biçim, Konum'un kelime aramasına girmesi değil, ayrı bir parça eşleşmesi: zaten Source alanları için kullanılan `pg_trgm` ile (ADR-0010). Böylece "kadı/kadın" türü gürültü Konum'a taşınmaz.
- **Durum.** Karar baspinarenes/homelibra#16'da aksi yönde verilmiş. Yeniden açılması önerilir; yeni kanıt yüzlerce belgeli fon-Source'ları.
- **Boy: S–M.** `note` tablosuna katlanmış Konum metni ve GIN trigram indeksi, arama sonucunda yeni bir eşleşme türü.
- **Çıkarım.** Bu fikrin değeri sahibin fon-Source'larının büyüklüğüne bağlı. Fonu tek Source tutan bir kullanıcıda yüksek, belgeyi Source yapan bir kullanıcıda düşük. Önce kendi Library'sinde sayılmalı.

### Daha büyük bahisler

#### 7. Masaüstü web: yazarken yan yana düzen · Boy: M

- **Sorun ve kim.** *Yazarken geri çağırma* masaüstünde ve Word'ün yanında oluyor. Web'de sol ray var ama Collection, Ara ve Source sayfası tek sütun. Collection'dan bir nota, oradan Source'a, oradan geri dönmek sayfa değişimi gerektiriyor.
- **Kanıt.** ADR-0001'in cilalama sırası açık: "Android capture, then web retrieval". Android Capture'ı baspinarenes/homelibra#157'yle olgunlaştı; sıradaki iş web geri çağırma. baspinarenes/homelibra#107'de "Masaüstü web şimdilik kapsam dışı" denmişti. Yazı Word'de yazılıyor [S10][S9]. Tarihçilerin anlattığı akışlarda da yazma ortamı not ortamından ayrı: Scrivener [S13], Obsidian'da Pandoc [S5].
- **Sözlük.** Collection, Search, Source, Note. Yeni terim yok.
- **ADR / karar.** ADR-0001 ile uyumlu, çünkü aynı ekranlar geniş düzende çiziliyor; bölünmüş bir Next.js istemcisi gerekmez. Ama baspinarenes/homelibra#12'nin Collection kararını ("Masaüstü ve telefon aynı düzen") yeniden açıyor.
- **Durum.** baspinarenes/homelibra#107'de bilinçli olarak ertelendi. Ayrı bir issue yok.
- **Boy: M.** Liste ve ayrıntı iki sütunda: Collection ya da Ara solda, notun Source sayfasındaki yeri sağda. Fikir 2'nin tek not kopyası buraya tıklamayla bağlanır. Klavyeyle gezinme: baspinarenes/homelibra#138, web'deki j/k/x kısayollarını Düzenle moduyla birlikte kaldırdı; yalnızca okuma ve kopya için olanlar geri gelebilir.
- **Çıkarım.** Değeri yüksek, çünkü ürünün iki yarısından birini tamamlıyor. Ama efor tasarım ağırlıklı ve baspinarenes/homelibra#107 gibi bir tasarım tuvali ister. Bu yüzden hızlı kazanımların arkasında.

#### 8. Zotero'dan Source içe aktarma (CSL JSON dosyasıyla) · Boy: M

- **Sorun ve kim.** Homelibra'ya geçen akademisyen, *ilk kurulum* adımında. Kaynakçası zaten Zotero'da. Yüzlerce Source'u elle yeniden girmek geçişin önündeki en büyük duvar.
- **Kanıt.** Tarihçilerin kendi anlatılarında Zotero kaynakça katmanı: Heppler Zotero'dan Obsidian'a künye ve notları çekiyor [S5]. Razlogova arşiv fotoğraflarını bile Zotero kayıtlarına ekliyor [S13]. Zotero'nun veri biçimleri sayfası CSL JSON, BibTeX ve RIS'i hem içe hem dışa aktarma biçimi olarak listeliyor [S20]. Web API'si de `csljson`, `bibtex`, `ris` ve `csv` veriyor, ama kişisel kütüphane için API anahtarı ya da OAuth 1.0a istiyor [S14]. Kullanıcının kendi dışa aktardığı dosya yüklenirse anahtar gerekmez.
- **Sözlük.** Source, Source type, Date, Bibliographic note. **Çıkarım:** CSL türleri dokuz türe eşlenebilir (ör. `book` → Kitap, `article-journal` ve `chapter` → Makale, `thesis` → Tez, `manuscript` → Yazma); eşlenemeyen alanlar Ek bilgi'ye gider. Eşleme tablosu CSL şemasından ayrıca çıkarılmalı.
- **ADR / karar.** ADR-0002: CSL tarihleri Milâdî gelir. "Metadata auto-fill writes Milâdî dates; the scholar can change the calendar afterwards" kuralı burada da geçerli. ADR-0004 ve ADR-0009: dosya yüklemesi yeni bir sağlayıcı eklemez. Zotero Web API yolu seçilirse eklenir (kontrol listesi baspinarenes/homelibra#31). ADR-0003 ile uyumlu: Zotero etiketleri Source etiketi olabilir ve notlara kopyalanmaz.
- **Durum.** baspinarenes/homelibra#14'te "içe aktarma yok" (MVP). Haritada (baspinarenes/homelibra#1) park edilmiş: "Dış kaynaklardan içe aktarma (Kindle, Zotero vurguları, Readwise); okuma ortamı ağırlıkla basılı olduğu için bekliyor." **Çıkarım:** bekletme gerekçesi vurgulara uyuyor, künyelere uymuyor. Basılı okuyan tarihçinin de kaynakçası dijitalde duruyor. Bu yüzden Source içe aktarma vurgu içe aktarmadan ayrı ve daha önce düşünülebilir.
- **Boy: M.** Eşleme tablosu, önizleme ("N kaynak, M'si zaten var"), ISBN/DOI ile yinelenen tespiti ve toplu Geri al gerekiyor (`deleteWithUndo` var). Yalnızca web'de olması yeterli (ADR-0001'deki iş bölümü).

#### 9. Arşiv belgesinin görüntüsü notun yanında (satın alınan dijital kopyayı eklemek) · Boy: L

- **Sorun ve kim.** Arşivle çalışan tarihçi, *geri çağırma* ve *atıf doğrulama* adımında. Not "BOA, DH.MKT 1234/56" diyor, ama belgenin kendisi bilgisayarda bir klasörde duruyor. Not ile görüntü arasındaki bağı elle tutmak gerekiyor.
- **Kanıt.** Devlet Arşivleri'nde araştırma "elektronik ortamda verilmesi esastır" [S4]. Görüntüler BETSİS'te incelenip "Seçili Görüntüleri Al" ve "E-Satış" ile ücret karşılığı alınıyor [S3]. Yani en azından Devlet Arşivleri'nde araştırmacının belgeye ulaştığı resmî yol satın alınan dosya. Okunan iki kaynak salonda fotoğraf çekmeye dair bir şey söylemiyor; bu yüzden kameranın hiç kullanılmadığı söylenemez. Kanada'daki 253 tarihçide de malzeme önce görüntü olarak toplanıp sonra işleniyor [S2]. Tarihçiler görüntüyü notun yanında tutmak için iş akışı kuruyor: Razlogova fotoğrafları klasör başına tek PDF'e birleştirip Zotero'daki `manuscript` kaydına ekliyor ve "no photographed document is ever lost or misfiled" diyor [S13]. Heppler her kaynağın fotoğraflarını tek PDF yapıp notlarının yanına koyuyor; Tropy'yi ayrı bir metadata kümesini güncel tutmak "real chore" olduğu için bırakmış [S5]. Tropy'nin kendi tanımı da arşiv fotoğrafı ile yazı arasındaki yolu kısaltmak [S1].
- **Sözlük.** Yeni bir terim gerekir, ör. **Attachment** (Ek). Cover'dan ayrılmalı: GLOSSARY'ye göre Cover "never part of what the scholar records". Ek ise araştırmanın kendisi. Bir Source'a mı (fon), bir Note'a mı (belge) bağlanacağı ayrı bir karar.
- **ADR / karar.** **ADR-0011 ile doğrudan çakışıyor.** Revisit maddesi tam olarak bunu söylüyor: "if a feature starts storing images that are research (a photo of a page), which would need backing up". Ekler yedeklenmeli; bu da 30 günlük silme sözünü ve günlük `pg_dump`'ın dışında bir yedeği gerektirir (ADR-0006). ADR-0008: outbox ikili veri taşımıyor; ek yalnızca çevrimiçi olur. ADR-0004: Library export ekleri de içermek zorunda ve ücretsiz kalmalı. baspinarenes/homelibra#10: "OCR'a ek olarak fotoğraf eki de MVP'de yok." Telif ve kullanım: Yönetmelik alınan kopyaların "ticari amaçla" çoğaltılmasını yasaklıyor [S4]. Özel bir Library'de saklamak bu yasağa girmez (**Çıkarım**, hukuki görüş değil).
- **Durum.** Haritada park edilmiş: "Sayfa fotoğrafı eki (Capture'da 'fotoğrafla, sonra yaz'); klavyeyle Capture baspinarenes/homelibra#11'de ve beta'da yetersiz kalırsa." **Çıkarım:** Devlet Arşivleri'nde çalışan biri için ihtiyaç büyük olasılıkla "fotoğrafla, sonra yaz" değil, "satın aldığım görüntüyü notun yanında tut". Koşul da buna göre yeniden yazılmalı.
- **Boy: L.** Depolama, yedekleme, kota, export, silme ve Geri al ile görüntüleyici gerekiyor. Yeni bir ADR şart.

#### 10. Not'a belge tarihi · Boy: M–L

- **Sorun ve kim.** Fonu ya da defteri tek Source olarak tutan arşiv tarihçisi, *düzenleme* ve *yazma* adımında. Belgelerin her birinin kendi tarihi var ve dipnot bu tarihi istiyor. Notlar ise yalnızca Konum sırasıyla diziliyor.
- **Kanıt.** Belleten'in arşiv dipnotu belge tarihini çift takvimle yazıyor: "27 Ca 1196 / 10 Mayıs 1782" [S10]. Heppler her belge notuna tarih koyup yazışmaları kronolojik listeliyor [S5].
- **Sözlük.** Date (ADR-0002'deki tip aynen: takvim + kısmi hassasiyet), Note, Locator.
- **ADR / karar.** **ADR-0002 ile çakışıyor:** "Only a source carries a date; a note does not … a scholar who wants chronological order makes each document its own source." ADR'nin de söylediği gibi, yeni bir tarih alanı aynı tipi kullanmalı. ADR-0008: Note'a alan eklemek outbox sözleşmesini de değiştirir. Collection'da Source grupları Tarih'e göre sıralı (baspinarenes/homelibra#3); Note tarihi bu sıralamayı etkilememeli ya da etkileyeceği ayrıca karara bağlanmalı.
- **Durum.** Haritada park edilmiş: "Note'a tipli Tarih (fon Source'unda belgeleri kronolojik sıralamak için); Tarih alanı Source'ta kullanıma girince." Koşul yerine geldi: Tarih baspinarenes/homelibra#44 ve baspinarenes/homelibra#80 (PR) ile çıktı. Artık sahibin gerçek kullanımında fon-Source'ların ne kadar yaygın olduğuna bakılabilir.
- **Boy: M–L.** Şema, outbox, yazma sayfasında seçici, sıralama ve export şeması değişiyor. Tarih seçicisi (baspinarenes/homelibra#112) yeniden kullanılır.

#### 11. Kaynaksız düşünce notları · Boy: M–L

- **Sorun ve kim.** Okumalar arasında bağlantı kuran ya da yazıya hazırlanan araştırmacı. Kendi gözlemi hiçbir Source'un bir Konum'una ait değil.
- **Kanıt.** Trent Üniversitesi tarih rehberi kişisel gözlemlerin kendi kartlarına yazılmasını öğütlüyor; kaynak kartlarından ayrı [S11]. Heppler kişi, tema ve fikir notlarını kaynak notlarının yanında tutuyor [S5].
- **Sözlük.** GLOSSARY'deki Note tanımıyla doğrudan çelişiyor: "A single record anchored to one locator of one source". Yeni bir terim ya da tanım değişikliği gerekir.
- **ADR / karar.** `note.source_id` NOT NULL ve `note_source_fk`. Collection'ın Source'a gruplu görünümü ve Markdown biçimi (baspinarenes/homelibra#12) bir "kaynaksız" grubu gerektirir. ADR-0003 etkilenmez.
- **Durum.** Haritada park edilmiş: "Kaynaksız düşünce ve sentez notları (MVP sonrası; Note'un Source zorunluluğu gevşer mi?)."
- **Boy: M–L.** Model, API, outbox ve görünümler değişiyor.
- **Çıkarım.** Bugün "Diğer" türünde "Düşüncelerim" adlı bir Source açmak işin çoğunu görüyor: notları etiketlenebiliyor ve Collection'a giriyor. Yani kazanç küçük, maliyet büyük. Bu yüzden son sırada. Önce sahibin bu geçici çözümü kullanıp kullanmadığına bakılmalı.

## Değerlendirilip elenenler

- **Uygulama içi OCR ya da el yazısı tanıma.** Haritada kapsam dışı. Fikir 4 (paylaşım hedefi + Lens) aynı ihtiyacı OCR yazmadan karşılıyor [S8].
- **Yapay zekâ ile özet, etiket önerisi ya da anlamsal arama.** Haritada kapsam dışı. ADR-0004'e göre içeriği sahibin kendi kullanımı dışında işleyen her özellik yeni bir karar ve yeni bir aydınlatma metni gerektiriyor.
- **Atıf biçimlendirme (Chicago, ISNAD), BibTeX ya da Zotero'ya aktarma, biçimli kaynakça listesi.** Haritada kapsam dışı. Fikir 1 ve 2 içeriği biçimli taşıyor ama atıf üretmiyor.
- **Hicrî/Rumî tarih çevirici aracı.** ADR-0002'ye göre dönüşüm yaklaşık ("never to state a date"), bir araç ise kesin tarih vaat eder.
- **Yazım hatası toleransı ya da varyant sözlüğü (Osman/ʿOsmān).** ADR-0005 ("no synonym or variant dictionary") ve ADR-0007'de reddedildi; haritada da yalnızca "gürültü ya da kayıp can sıkarsa" diye park edilmiş.
- **Organizing pass'i, Düzenlenecekler'i ya da Note merge'ü geri getirmek.** baspinarenes/homelibra#138 hepsini bilerek kaldırdı ve GLOSSARY'den sildi.
- **Collection'da elle sıralama ya da not sabitleme.** Kart karıştırarak taslak kurmak öğütleniyor [S11], ama GLOSSARY'deki Collection tanımı "notes are never moved, pinned into or hidden from a collection" diyor. Haritadaki "sıralama seçenekleri" park maddesi de yazara göre sıralamaktan söz ediyor, elle düzenden değil.
- **Aralıklı tekrar ya da Daily Review.** Haritada kapsam dışı.
- **Ortak ya da paylaşılan Collection (danışman ile öğrenci).** Kapsam dışı, "SaaS'ın ikinci haritası".
- **PDF okuyucu ve içinde işaretleme.** Kapsam dışı.
- **Çevrimdışı arama.** ADR-0005, ADR-0007 ve ADR-0008'de bilerek dışarıda bırakıldı. Haritada SQLite FTS5 ile park edilmiş, ama web'de FTS yok.
- **Kindle/Readwise vurgularını içe aktarma.** Harita "okuma ortamı ağırlıkla basılı" diyor ve Türkçe e-kitap kullanımına dair bir kanıt bulunmadı. Önce künye içe aktarma (fikir 8) geliyor.
- **Sunucunun Internet Archive'a "Save Page Now" isteği göndermesi.** Library içeriğini üçüncü tarafa yollar (ADR-0004, ADR-0009). Fikir 3'te kullanıcının açtığı bir bağlantıya indirildi.
- **Arşiv türüne ayrı fon, katalog ve kurum alanları.** baspinarenes/homelibra#2'nin kararı Yazar = kurum, Başlık = atıftaki ad. Belleten'in "BOA, C. ML" biçimi bu alanlara zaten sığıyor [S10].
- **Android ana ekran kısayolu ya da widget.** Kaldığın yer zaten tek dokunuş. Akademisyen tarafında bir kanıt bulunamadı.
- **Sesle not alma.** **Çıkarım (doğrulanmadı):** Android klavyesinin dikte özelliği yazma sayfasında zaten çalışır, ayrı bir özellik gerekmez.

## Açık sorular

Yalnızca ürün sahibinin karar verebileceği noktalar:

1. Fikir 4 haritanın "tarayıcı eklentisi / OCR kapsam dışı" sınırının içinde mi sayılır, dışında mı?
2. Fikir 6 için baspinarenes/homelibra#16'daki "Locator aranmaz" kararı fon-Source'larla yeniden açılmaya değer mi? Kendi Library'inde en büyük fon-Source kaç not?
3. Fikir 9'daki ihtiyaç "fotoğrafla, sonra yaz" mı, yoksa "satın aldığım BETSİS görüntüsünü notun yanında tut" mu? İkincisiyse haritadaki park koşulu yeniden yazılmalı.
4. Fikir 8'de vurgular ile künyeler ayrılabilir mi? Yani "içe aktarma yok" kararı yalnızca künye için gevşetilebilir mi?

## Kaynaklar

- [S1] Tropy, ana sayfa ("shortens the path from finding archival sources to writing about them") — https://tropy.org/
- [S2] Ian Milligan, "We Are All Digital Now: Digital Photography and the Reshaping of Historical Practice", *Canadian Historical Review*, Aralık 2020, DOI 10.3138/chr-2020-0023 (UWSpace özeti) — https://uwspace.uwaterloo.ca/items/01421136-7ecf-4961-b106-960a2205f150
- [S3] T.C. Cumhurbaşkanlığı Devlet Arşivleri Başkanlığı, "Arşivde Araştırma Esasları" (BETSİS, "Seçili Görüntüleri Al", E-Satış) — https://www.devletarsivleri.gov.tr/Sayfalar/Sayfa.aspx?icerik=1045&h=E82E2E152A0EDDCEBACD12E4FD6194A33830B07932BDA84FE10AA35AE29E62D3
- [S4] Arşivlerden Yararlanma Usul ve Esasları Hakkında Yönetmelik, Resmî Gazete 2 Ekim 2021, sayı 31616, md. 7, 8, 11, 12. Metin Resmî Gazete'de açılamadığı için bir mevzuat sitesindeki kopyasından okundu (ikincil kopya; bağlayıcı metin Resmî Gazete'dir) — https://www.alomaliye.com/2021/10/02/arsivlerden-yararlanma-usul-ve-esaslari-hakkinda-yonetmelik/
- [S5] Jason A. Heppler (çevre ve dijital tarihçi), "How I Use Obsidian Redux", 2026-01-08 — https://jasonheppler.org/2026/01/08/how-i-use-obsidian-redux/
- [S6] Expo SDK 58, Sharing ("Sharing to your app from other apps", "currently experimental", config plugin `android.enabled`) — https://docs.expo.dev/versions/latest/sdk/sharing/
- [S7] Expo SDK 58, Clipboard (`setStringAsync`, `inputFormat`, `StringFormat.HTML`) — https://docs.expo.dev/versions/latest/sdk/clipboard/
- [S8] Google Fotoğraflar Yardım, "Get info about your photos & surroundings" (Android, Lens ile metin kopyalama) — https://support.google.com/photos/answer/7539151?hl=en&co=GENIE.Platform%3DAndroid
- [S9] Dennis Tenen ve Grant Wythoff, "Sustainable Authorship in Plain Text using Pandoc and Markdown", *Programming Historian*, 2014 — https://programminghistorian.org/en/lessons/sustainable-authorship-in-plain-text-using-pandoc-and-markdown
- [S10] Türk Tarih Kurumu, Belleten, "Yazım Kuralları" ("Makale Formatı: PDF ve Microsoft Word"; dipnot; "BOA, C. ML, 753/30679"; "27 Ca 1196 / 10 Mayıs 1782") — https://belleten.gov.tr/sayfa/yazim-kurallari
- [S11] Trent University, History Online Workbook, "Research Strategies: Notetaking" — https://www.trentu.ca/history/node/87
- [S12] Zotero Documentation, "Collections and Tags" ("Only items that have all of the selected tags will be shown") — https://www.zotero.org/support/collections_and_tags
- [S13] Elena Razlogova, "DIY Image Management with Zotero", *Perspectives on History* (American Historical Association), 2012-10-01 — https://www.historians.org/perspectives-article/diy-image-management-with-zotero-october-2012/
- [S14] Zotero Web API v3, "Basics" (API anahtarı / OAuth 1.0a; `format` değerleri: `csljson`, `bibtex`, `ris`, `csv` …) — https://www.zotero.org/support/dev/web_api/v3/basics
- [S15] YouTube Yardım, "Share videos & channels" ("check this box and enter the start time") — https://support.google.com/youtube/answer/57741?hl=en
- [S16] Doug Boyd, "OHMS: Enhancing access to oral history for free", *Oral History Review*, 2013 — https://scholars.uky.edu/en/publications/ohms-enhancing-access-to-oral-history-for-free/
- [S17] Internet Archive Help Center, "Using the Wayback Machine" (Save Page Now) — https://help.archive.org/help/using-the-wayback-machine/
- [S18] Martin Klein ve ark., "Scholarly Context Not Found: One in Five Articles Suffers from Reference Rot", *PLOS ONE*, 2014 (STM alanı) — https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0115253
- [S19] Zotero Forums, "Boolean OR Tag selection" (2008–2026) — https://forums.zotero.org/discussion/2224/boolean-or-tag-selection
- [S20] Zotero Documentation, "Bibliographic Data Formats" (CSL JSON, BibTeX, RIS: içe ve dışa aktarma) — https://www.zotero.org/support/dev/data_formats

İç kaynaklar: `GLOSSARY.md`; `docs/adr/0001`–`0011`; `docs/research/existing-tools.md` ([R1], [H1], [H2], Açık soru 3); harita baspinarenes/homelibra#1; kararlar baspinarenes/homelibra#2, baspinarenes/homelibra#3, baspinarenes/homelibra#10, baspinarenes/homelibra#12, baspinarenes/homelibra#14, baspinarenes/homelibra#16, baspinarenes/homelibra#107, baspinarenes/homelibra#138, baspinarenes/homelibra#157; kod `apps/app/src/components/collection-actions.tsx`, `apps/app/src/components/source-form.tsx`, `packages/core/src/lib/markdown.ts`, `packages/core/src/lib/source-layout.ts`, `apps/api/src/db/schema.ts`.
